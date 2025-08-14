// app/api/detection/route.js
import { NextResponse } from 'next/server';
import { detectContent } from './detection-logic.js';

// === POST Handler ===
export async function POST(request) {
    try {
        console.log("=== Incoming Detection Request ===");

        const { text, labelGroup } = await request.json();

        // Use the extracted detection logic
        const result = await detectContent(text, labelGroup);

        console.log("=== Detection Complete ===");
        return NextResponse.json(result);

    } catch (error) {
        console.error(`[API Fatal Error] ${error.stack}`);

        // Return specific error messages for validation errors
        if (error.message.includes("Invalid or missing")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}