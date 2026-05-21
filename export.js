import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { google } from "googleapis";
import fs from "fs";

// ---- Настройка Firebase ----
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// ---- Настройка Google Sheets ----
const sheets = google.sheets("v4");
const auth = new google.auth.GoogleAuth({
    keyFile: "serviceAccountKey.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

// ---- ID таблицы и листа ----
const SPREADSHEET_ID = "10p_Zx4rNRXm5dSyWY_ZnfT2gg8_BFTSsRvfMFy3vWLc";
const SHEET_NAME = "Лист1";

// ---- Выгрузка данных ----
async function exportFeedback() {
    try {
        const snapshot = await db.collection("app_feedback").get();
        const rows = [];

        // Заголовки
        rows.push([
            "createdAt", "date", "deletedReasonOption", "feedbackType",
            "heardAboutOption", "id", "metadata", "placeId", "placeName",
            "rating", "selectedOptionIndex", "source", "userId", "userName",
            "userUsername", "wantMoreCategories"
        ]);

        snapshot.forEach(doc => {
            const data = doc.data();

            rows.push([
                data.createdAt ? data.createdAt.toDate().toISOString() : "",
                data.date || "",
                data.deletedReasonOption ?? "",
                data.feedbackType || "",
                data.heardAboutOption ?? "",
                data.id || "",
                data.metadata ? JSON.stringify(data.metadata) : "",
                data.placeId || "",
                data.placeName || "",
                data.rating ?? "",
                data.selectedOptionIndex ?? "",
                data.source || "",
                data.userId || "",
                data.userName || "",
                data.userUsername || "",
                data.wantMoreCategories ? data.wantMoreCategories.join(", ") : ""
            ]);
        });

        const client = await auth.getClient();

        // ---- Очистка листа ----
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_NAME,
            auth: client
        });

        // ---- Запись данных ----
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_NAME,
            valueInputOption: "RAW",
            requestBody: {
                values: rows
            },
            auth: client
        });

        console.log("Данные успешно выгружены в Google Sheets!");
    } catch (error) {
        console.error(error);
    }
}

exportFeedback();