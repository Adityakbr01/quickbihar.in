import mongoose from "mongoose";
import { ENV } from "../config/env.config";
import { SubOrder } from "../modules/order/subOrder.model";
import { sellerSettlementService } from "../modules/seller/sellerSettlement.service";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 500;

async function backfillSellerSettlements() {
  await mongoose.connect(ENV.MONGODB_URI);

  const report = await sellerSettlementService.missingDeliveredSubOrderSettlements({ limit });
  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    scanned: report.scanned,
    missing: report.missing,
    totalNetAmount: report.totalNetAmount,
    rows: report.rows,
  }, null, 2));

  if (apply && report.rows.length > 0) {
    const results = [];
    for (const row of report.rows) {
      const subOrder = await SubOrder.findById(row.subOrderObjectId).populate("parentOrderId");
      if (!subOrder) {
        results.push({
          subOrderId: row.subOrderId,
          settled: false,
          reason: "SUB_ORDER_NOT_FOUND",
        });
        continue;
      }

      const result = await sellerSettlementService.settleSubOrder(subOrder, {
        source: "BACKFILL",
        note: "Backfilled delivered sub-order seller settlement.",
      });
      results.push({
        subOrderId: row.subOrderId,
        settled: result.settled,
        alreadySettled: result.alreadySettled,
        amount: result.amount,
        reason: result.reason,
      });
    }

    console.log(JSON.stringify({
      mode: "apply-result",
      settled: results.filter((result) => result.settled).length,
      alreadySettled: results.filter((result) => result.alreadySettled).length,
      totalSettledAmount: results.reduce((sum, result) => sum + Number(result.settled ? result.amount : 0), 0),
      results,
    }, null, 2));
  }

  const underpaidReport = await sellerSettlementService.underpaidDeliveredSubOrderSettlements({ limit });
  console.log(JSON.stringify({
    mode: apply ? "repair-check" : "repair-dry-run",
    scanned: underpaidReport.scanned,
    underpaid: underpaidReport.underpaid,
    totalDelta: underpaidReport.totalDelta,
    rows: underpaidReport.rows,
  }, null, 2));

  if (!apply || underpaidReport.rows.length === 0) return;

  const repairResults = [];
  for (const row of underpaidReport.rows) {
    const subOrder = await SubOrder.findById(row.subOrderObjectId).populate("parentOrderId");
    if (!subOrder) {
      repairResults.push({
        subOrderId: row.subOrderId,
        repaired: false,
        reason: "SUB_ORDER_NOT_FOUND",
      });
      continue;
    }

    const result = await sellerSettlementService.repairUnderpaidSubOrderSettlement(subOrder, row.earningId, {
      source: "BACKFILL",
      note: "Repaired under-credited delivered sub-order seller settlement.",
    });
    repairResults.push({
      subOrderId: row.subOrderId,
      repaired: result.repaired,
      delta: result.delta,
      amount: result.amount,
      reason: result.reason,
    });
  }

  console.log(JSON.stringify({
    mode: "repair-result",
    repaired: repairResults.filter((result) => result.repaired).length,
    totalDelta: repairResults.reduce((sum, result) => sum + Number(result.repaired ? result.delta : 0), 0),
    results: repairResults,
  }, null, 2));
}

backfillSellerSettlements()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  });
