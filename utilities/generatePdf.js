const PDFDocument = require("pdfkit");
const fs = require("fs");
const moment = require("moment");
const path = require("path");

const generatePDF = (res, accountId, account) => {
  const doc = new PDFDocument();
  doc.pipe(
    fs.createWriteStream(
      path.join(__dirname, "..", "transactions", `${accountId}.pdf`)
    )
  );
  doc.font("Times-Roman");
  doc
    .fontSize(20)
    .text(`Transaction history for: ${account.accountOwner.fullName}`, {
      align: "center",
    });
  doc.moveDown();
  doc
    .fontSize(15)
    .font("Times-Bold")
    .text(`IBAN: ${account.accountIBAN}`, { align: "center" });
  doc.font("Times-Roman");
  doc.moveDown();
  account.transactionsHistory
    .sort((t1, t2) => {
      return t2.timeStamp - t1.timeStamp;
    })
    .forEach((trans) => {
      const timeStamp = moment(new Date(trans.timeStamp)).format("DD-MM-YYYY");
      if (trans.type === "created") {
        doc
          .fillColor("green")
          .text(`Account has been created at: ${timeStamp}`);
      }
      if (trans.type === "transfer") {
        doc.fillColor("grey").text(`Transfer at: ${timeStamp}`);
        doc
          .fillColor("black")
          .text(
            `Transferred amount: ${trans.transferAmount} catre ${trans.destinationIBAN}`
          );
      }
      if (trans.type === "withdraw") {
        doc.fillColor("orange").text(`Withdraw at: ${timeStamp}`);
        doc
          .fillColor("black")
          .text(`Withdraw amount: -${trans.withdrawAmount}`);
      }
      if (trans.type === "deposit") {
        doc.fillColor("blue").text(`Deposit at: ${timeStamp}`);
        doc.fillColor("black").text(`Deposit amount: +${trans.depositAmount}`);
      }
      doc.moveDown();
    });
  doc.pipe(res);
  doc.end();
};

module.exports = generatePDF;
