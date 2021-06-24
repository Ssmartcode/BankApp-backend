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
    .text(`Istoric tranzactii pentru: ${account.accountOwner.fullName}`, {
      align: "center",
    });
  doc.moveDown();
  doc
    .fontSize(15)
    .font("Times-Bold")
    .text(`IBAN: ${account.accountIBAN}`, { align: "center" });
  doc.font("Times-Roman");
  doc.moveDown();
  account.transactionsHistory.forEach((trans) => {
    const timeStamp = moment(new Date(trans.timeStamp)).format("DD-MM-YYYY");
    if (trans.type === "created") {
      doc.fillColor("green").text(`Cont creat la data de: ${timeStamp}`);
    }
    if (trans.type === "transfer") {
      doc.fillColor("grey").text(`Transfer la: ${timeStamp}`);
      doc
        .fillColor("black")
        .text(
          `Suma transferata: ${trans.transferAmount} catre ${trans.destinationIBAN}`
        );
    }
    if (trans.type === "withdraw") {
      doc.fillColor("orange").text(`Retragere la: ${timeStamp}`);
      doc.fillColor("black").text(`Suma retrasa: -${trans.withdrawAmount}`);
    }
    if (trans.type === "deposit") {
      doc.fillColor("blue").text(`Depunere la: ${timeStamp}`);
      doc.fillColor("black").text(`Suma depusa: +${trans.depositAmount}`);
    }
    doc.moveDown();
  });
  doc.pipe(res);
  doc.end();
};

module.exports = generatePDF;
