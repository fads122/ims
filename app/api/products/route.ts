import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEquipmentQRCode, generateEquipmentBarcode, generateQRCode, generateBarcode } from "@/lib/qr-barcode-generator";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "operational") {
      // Validate required fields
      if (!data.name || !data.serialNumber || !data.condition || !data.quantity) {
        return NextResponse.json(
          { error: "Missing required fields: name, serialNumber, condition, and quantity are required" },
          { status: 400 }
        );
      }

      // Generate QR code and barcode
      let qrCode = "";
      let barcode = "";
      try {
        console.log("Generating QR code and barcode for:", data.serialNumber, data.name);
        qrCode = await generateEquipmentQRCode(data.serialNumber, data.name);
        console.log("QR code generated successfully, length:", qrCode.length);
        barcode = await generateEquipmentBarcode(data.serialNumber);
        console.log("Barcode generated successfully, length:", barcode.length);
      } catch (error: any) {
        console.error("Error generating QR code/barcode:", error);
        console.error("Error details:", error.message, error.stack);
        // Continue without codes if generation fails, but log the error
      }

      const { data: insertedData, error } = await supabase
        .from("operational_equipment")
        .insert({
          product_type: data.productType || null,
          name: data.name,
          brand: data.brand || null,
          model: data.model || null,
          quantity: data.quantity,
          box_quantity: data.boxQuantity || 0,
          serial_number: data.serialNumber,
          date_acquired: data.dateAcquired || null,
          condition: data.condition,
          damage_status: data.damageStatus || "Not Damaged",
          images: data.images || [],
          qr_code: qrCode || null,
          barcode: barcode || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      return NextResponse.json({ success: true, data: insertedData }, { status: 201 });
    } else if (type === "for-sale") {
      // Generate QR code and barcode for for-sale products
      // Use product_model or product_brand as identifier
      const identifier = data.productModel || data.productBrand || data.id || "";
      let qrCode = "";
      let barcode = "";
      
      if (identifier) {
        try {
          // For for-sale: QR code contains model/brand, barcode uses model/brand
          qrCode = await generateQRCode(identifier);
          barcode = await generateBarcode(identifier);
        } catch (error) {
          console.error("Error generating QR code/barcode for for-sale product:", error);
        }
      }

      const { data: insertedData, error } = await supabase.from("for_sale_products").insert({
        category: data.category,
        product_model: data.productModel,
        product_brand: data.productBrand,
        supplier: data.supplier,
        supplier_cost: data.supplierCost,
        srp: data.srp,
        quantity: data.quantity,
        box_quantity: data.boxQuantity,
        location: data.location,
        condition: data.condition,
        description: data.description,
        brochure_url: data.brochureUrl,
        images: data.images || [],
        qr_code: qrCode || null,
        barcode: barcode || null,
      }).select().single();

      if (error) throw error;
      
      return NextResponse.json({ success: true, data: insertedData }, { status: 201 });
    } else if (type === "package") {
      // Validate required fields
      if (!data.packageName || !data.ownershipType || !data.supplier || !data.location || !data.condition) {
        return NextResponse.json(
          { error: "Missing required fields: packageName, ownershipType, supplier, location, and condition are required" },
          { status: 400 }
        );
      }

      if (!data.packageItems || data.packageItems.length === 0) {
        return NextResponse.json(
          { error: "Package must contain at least one item" },
          { status: 400 }
        );
      }

      // Transform package items to match database structure
      const packageContents = data.packageItems.map((item: any) => ({
        item_category: item.itemCategory,
        item_model: item.itemModel,
        item_brand: item.itemBrand,
        item_quantity: item.itemQuantity || 1,
        item_condition: item.itemCondition || "New",
      }));

      // Generate QR code and barcode for package/bundle
      // Use package_name as identifier
      let qrCode = "";
      let barcode = "";
      if (data.packageName) {
        try {
          // For packages: QR code contains package name, barcode uses package name
          qrCode = await generateQRCode(data.packageName);
          barcode = await generateBarcode(data.packageName);
        } catch (error) {
          console.error("Error generating QR code/barcode for package:", error);
        }
      }

      const { data: insertedData, error } = await supabase
        .from("package_bundles")
        .insert({
          ownership_type: data.ownershipType,
          package_name: data.packageName,
          package_category: data.packageCategory || "Package/Bundle",
          package_contents: packageContents,
          package_description: data.packageDescription || null,
          supplier: data.supplier,
          cost: data.packageCost || 0,
          srp: data.packageSrp || 0,
          quantity: data.packageQuantity || 0,
          location: data.location,
          condition: data.condition,
          brochure_url: data.brochureUrl || null,
          images: data.images || [],
          qr_code: qrCode || null,
          barcode: barcode || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Record initial pricing history
      await supabase.from("pricing_history").insert({
        product_id: insertedData.id,
        product_type: "package",
        cost: data.packageCost || 0,
        srp: data.packageSrp || 0,
      });

      return NextResponse.json({ success: true, data: insertedData }, { status: 201 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let data;
    if (type === "operational") {
      const { data: products, error } = await supabase
        .from("operational_equipment")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      data = products;
    } else if (type === "for-sale") {
      const { data: products, error } = await supabase
        .from("for_sale_products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      data = products;
    } else if (type === "package") {
      const { data: products, error } = await supabase
        .from("package_bundles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      data = products;
    } else {
      // Get all products
      const [operational, forSale, packages] = await Promise.all([
        supabase.from("operational_equipment").select("*").order("created_at", { ascending: false }),
        supabase.from("for_sale_products").select("*").order("created_at", { ascending: false }),
        supabase.from("package_bundles").select("*").order("created_at", { ascending: false }),
      ]);
      data = {
        operational: operational.data || [],
        forSale: forSale.data || [],
        packages: packages.data || [],
      };
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, data } = body;

    if (!id) {
      return NextResponse.json({ error: "Equipment ID is required" }, { status: 400 });
    }

    if (type === "operational") {
      // Validate required fields
      if (!data.name || !data.serialNumber || !data.condition || !data.quantity) {
        return NextResponse.json(
          { error: "Missing required fields: name, serialNumber, condition, and quantity are required" },
          { status: 400 }
        );
      }

      // Regenerate QR code and barcode if serial number or name changed
      let qrCode = data.qr_code;
      let barcode = data.barcode;
      if (data.regenerateCodes) {
        try {
          qrCode = await generateEquipmentQRCode(data.serialNumber, data.name);
          barcode = await generateEquipmentBarcode(data.serialNumber);
        } catch (error: any) {
          console.error("Error regenerating QR code/barcode:", error);
        }
      }

      const { data: updatedData, error } = await supabase
        .from("operational_equipment")
        .update({
          product_type: data.productType || null,
          name: data.name,
          brand: data.brand || null,
          model: data.model || null,
          quantity: data.quantity,
          box_quantity: data.boxQuantity || 0,
          serial_number: data.serialNumber,
          date_acquired: data.dateAcquired || null,
          condition: data.condition,
          damage_status: data.damageStatus || "Not Damaged",
          images: data.images || [],
          qr_code: qrCode || null,
          barcode: barcode || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data: updatedData }, { status: 200 });
    } else if (type === "for-sale") {
      // Validate required fields
      if (!data.category || !data.productModel || !data.supplier || !data.quantity || !data.condition) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      // Regenerate QR code and barcode if needed
      let qrCode = data.qr_code;
      let barcode = data.barcode;
      if (data.regenerateCodes) {
        try {
          const codeData = `${data.productBrand}-${data.productModel}-${id}`;
          qrCode = await generateQRCode(codeData);
          barcode = await generateBarcode(codeData);
        } catch (error: any) {
          console.error("Error regenerating QR code/barcode for for-sale product:", error);
        }
      }

      // Get current product to compare prices
      const { data: currentProduct } = await supabase
        .from("for_sale_products")
        .select("supplier_cost, srp")
        .eq("id", id)
        .single();

      const { data: updatedData, error } = await supabase
        .from("for_sale_products")
        .update({
          category: data.category,
          product_model: data.productModel,
          product_brand: data.productBrand,
          supplier: data.supplier,
          supplier_cost: data.supplierCost,
          srp: data.srp,
          quantity: data.quantity,
          box_quantity: data.boxQuantity,
          location: data.location,
          condition: data.condition,
          description: data.description,
          brochure_url: data.brochureUrl,
          images: data.images || [],
          qr_code: qrCode || null,
          barcode: barcode || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Record pricing history if prices changed
      if (currentProduct && (
        currentProduct.supplier_cost !== data.supplierCost ||
        currentProduct.srp !== data.srp
      )) {
        await supabase.from("pricing_history").insert({
          product_id: id,
          product_type: "for-sale",
          supplier_cost: data.supplierCost,
          srp: data.srp,
        });
      }

      return NextResponse.json({ data: updatedData }, { status: 200 });
    } else if (type === "package") {
      // Validate required fields
      if (!data.packageName || !data.packageCategory || !data.quantity) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      // Regenerate QR code and barcode if needed
      let qrCode = data.qr_code;
      let barcode = data.barcode;
      if (data.regenerateCodes) {
        try {
          const codeData = data.packageName;
          qrCode = await generateQRCode(codeData);
          barcode = await generateBarcode(codeData);
        } catch (error: any) {
          console.error("Error regenerating QR code/barcode for package:", error);
        }
      }

      // Get current product to compare prices
      const { data: currentProduct } = await supabase
        .from("package_bundles")
        .select("cost, srp")
        .eq("id", id)
        .single();

      const { data: updatedData, error } = await supabase
        .from("package_bundles")
        .update({
          package_name: data.packageName,
          package_category: data.packageCategory,
          ownership_type: data.ownershipType,
          supplier: data.supplier,
          cost: data.cost,
          srp: data.srp,
          quantity: data.quantity,
          location: data.location,
          condition: data.condition,
          package_description: data.packageDescription,
          package_contents: data.packageContents || [],
          images: data.images || [],
          qr_code: qrCode || null,
          barcode: barcode || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Record pricing history if prices changed
      if (currentProduct && (
        currentProduct.cost !== data.cost ||
        currentProduct.srp !== data.srp
      )) {
        await supabase.from("pricing_history").insert({
          product_id: id,
          product_type: "package",
          cost: data.cost,
          srp: data.srp,
        });
      }

      return NextResponse.json({ data: updatedData }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


