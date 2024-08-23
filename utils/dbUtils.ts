import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

// In dbUtils.ts
// dbUtils.ts

export async function createReading(
  walletAddress: string,
  cardId: string,
  deckId: string,
  imageUrl: string,
  index: number
) {
  try {
    const readingId = uuidv4();
    const { data, error } = await supabase.from("readings").insert([
      {
        reading_id: readingId,
        wallet_address: walletAddress,
        deck_id: deckId,
        card_id: cardId,
        nft_id: uuidv4(),
        image_url: imageUrl,
        index: index,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;
    return readingId;
  } catch (error) {
    console.error("Error creating reading:", error);
    throw error;
  }
}

export async function createOrUpdateUser(walletAddress: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .upsert(
        { wallet_address: walletAddress },
        { onConflict: "wallet_address" }
      )
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
}
