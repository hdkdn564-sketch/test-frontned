export interface DocumentSettings {
  // السجل التجاري
  crName: string;
  crNumber: string;
  crImage: string;
  crLink: string;

  // مركز الأعمال
  bcTitle: string;
  bcSubtitle: string;
  bcNumber: string;
  bcImage: string;
  bcLink: string;

  // ضريبة القيمة المضافة / PDF
  vatTitle: string;
  vatImage: string;
  vatPdf: string;
}

export const defaultDocumentSettings: DocumentSettings = {
  crName: "السجل التجاري",
  crNumber: "7055426618",
  crImage: "/commerce.webp",
  crLink: "",

  bcTitle: "شهادة التوثيق",
  bcSubtitle: "مركز الاعمال",
  bcNumber: "0000336194",
  bcImage: "/work.webp",
  bcLink: "https://qr.saudibusiness.gov.sa/viewcr?nCrNumber=v2eosJ+qA5kQRXufqrwSSw==",

  vatTitle: "شهادة ضريبة القيمة المضافة",
  vatImage: "/شعار ضريبة القيمة المضافة بدقة عالية svg - png (1).png",
  vatPdf: "/qema.pdf",
};
