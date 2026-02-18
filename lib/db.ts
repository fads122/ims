import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  createdAt: string;
}

type DbUser = {
  id: string;
  email: string;
  password: string;
  created_at: string;
};

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Run create-users-table.sql in Supabase SQL Editor first."
    );
  }
  return createClient(url, key);
}

function toUser(row: DbUser): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    createdAt: row.created_at,
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, password, created_at")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("findUserByEmail error:", error);
    throw error;
  }
  return data ? toUser(data as DbUser) : null;
}

export async function createUser(
  email: string,
  hashedPassword: string
): Promise<User> {
  const supabase = getSupabase();
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: normalizedEmail,
      password: hashedPassword,
    })
    .select("id, email, password, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      // unique_violation
      const err = new Error("An account with this email already exists");
      (err as Error & { code?: string }).code = "DUPLICATE_EMAIL";
      throw err;
    }
    console.error("createUser error:", error);
    throw error;
  }

  return toUser(data as DbUser);
}
