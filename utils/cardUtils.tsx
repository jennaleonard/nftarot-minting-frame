import { supabase } from './supabase';
import { constructFullImageUrl } from './imageUtils';

export interface Card {
  card_id: string;
  deck_id: string;
  card_name: string;
  image_url: string;
  card_read_main: string;
}

export async function getCardByIndex(
  index: number,
): Promise<Card | null> {
  try {
    const { data, error } = await supabase
      .from("cards")
      .select("card_id, deck_id, card_name, image_url, card_read_main")
      .eq("index", index)
      .single();

    if (error) {
      console.error("Error fetching card:", error);
      return null;
    }

    if (!data) {
      console.error("No card found at the specified index");
      return null;
    }

    // Construct the full image URL
    data.image_url = constructFullImageUrl(data.image_url);

    console.log("Fetched card:", data);

    if (data) {
      return {
        card_id: data.card_id,
        deck_id: data.deck_id,
        image_url: data.image_url,
        card_name: data.card_name,
        card_read_main: data.card_read_main
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching card:', error);
    return null;
  }
}

export function generateRandomIndex(): number {
  const minIndex = 0;
  const maxIndex = 155;

  return Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex;
}

export interface Reading {
  id: string;
  created_at: string;
  deck_id: string;
  card_id: string;
  image_url: string;
  cardIndex: number;
}
