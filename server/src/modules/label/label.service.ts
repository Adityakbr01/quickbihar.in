import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import { orderDAO } from "../order/order.dao";
import { ApiError } from "../../utils/ApiError";
import type { IOrderItem } from "../order/order.type";

export class LabelService {
    /**
     * Generates a Barcode Buffer using bwip-js
     */
    private async generateBarcode(text: string): Promise<Buffer> {
        return await bwipjs.toBuffer({
            bcid: "code128",       // Barcode type
            text: text,           // Text to encode
            scale: 3,             // 3x scaling factor
            height: 10,           // Bar height, in millimeters
            includetext: true,    // Include human-readable text
            textxalign: "center", // Always good to set this
        });
    }

    /**
     * Generates a Shipping Label PDF for a given order
     */
    async generateShippingLabel(id: string): Promise<PDFKit.PDFDocument> {
        const order = await orderDAO.findById(id);
        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        const doc = new PDFDocument({
            size: "A6", // Common shipping label size (or 4x6 inches)
            margin: 10,
        });

        // --- Header Section ---
        doc.fontSize(16).font("Helvetica-Bold").text("QUICK BIHAR", { align: "center" });
        doc.fontSize(8).font("Helvetica").text("Digital Handloom & Premium Apparel", { align: "center" });
        doc.moveDown(0.5);
        doc.lineWidth(0.5).moveTo(10, doc.y).lineTo(doc.page.width - 10, doc.y).stroke();
        doc.moveDown(0.5);

        // --- Barcode Section ---
        const barcodeBuffer = await this.generateBarcode(order.orderId);
        doc.image(barcodeBuffer, {
            fit: [doc.page.width - 40, 50],
            align: "center",
        });
        doc.moveDown(2);

        // --- Order & Customer Info ---
        doc.fontSize(10).font("Helvetica-Bold").text("SHIP TO:");
        doc.fontSize(10).font("Helvetica").text(order.shippingAddress.fullName);
        doc.text(order.shippingAddress.street);
        doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`);
        doc.text(`Phone: ${order.shippingAddress.phone}`);
        if (order.shippingAddress.landmark) {
            doc.fontSize(8).text(`Landmark: ${order.shippingAddress.landmark}`);
        }

        doc.moveDown(1);
        doc.lineWidth(0.5).moveTo(10, doc.y).lineTo(doc.page.width - 10, doc.y).stroke();
        doc.moveDown(0.5);

        // --- Product Info ---
        doc.fontSize(10).font("Helvetica-Bold").text("ORDER DETAILS:");
        doc.fontSize(9).font("Helvetica");

        order.items.forEach((item: IOrderItem, index: number) => {
            doc.text(`${index + 1}. ${item.title}  [${item.size}/${item.color}]`);
            doc.fontSize(8).text(`   SKU: ${item.sku} | Qty: ${item.quantity}`, { indent: 10 });
            doc.moveDown(0.2);
        });

        doc.moveDown(0.5);
        doc.lineWidth(0.5).moveTo(10, doc.y).lineTo(doc.page.width - 10, doc.y).stroke();
        doc.moveDown(0.5);

        // --- Footer ---
        doc.fontSize(10).font("Helvetica-Bold").text(`Order ID: ${order.orderId}`, { align: "left" });
        doc.fontSize(8).font("Helvetica").text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });

        return doc;
    }
}

export const labelService = new LabelService();