import { StoredArchetype } from '../types';

const ATLAS_STORAGE_KEY = 'jungianMindAtlas';

/**
 * Retrieves the entire Mind Atlas data from local storage.
 * @returns A dictionary of stored archetypes.
 */
export const getMindAtlasData = (): { [key: string]: StoredArchetype } => {
  try {
    const rawData = localStorage.getItem(ATLAS_STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : {};
  } catch (error) {
    console.error("Failed to parse Mind Atlas data from localStorage", error);
    return {};
  }
};

/**
 * Saves a new insight for a specific archetype and persists it to local storage.
 * It ensures that a maximum of 3 insights are kept per archetype.
 * @param archetypeName The name of the archetype (e.g., "The Hero").
 * @param insightText The personalized text summary of the experience.
 */
export const saveArchetypeInsight = (archetypeName: string, insightText: string): void => {
  try {
    if (!insightText || !insightText.trim()) return;

    const atlasData = getMindAtlasData();
    // Trim the key to ensure data consistency before saving.
    const key = archetypeName.trim();
    
    const existingArchetype = atlasData[key] || {
      name: key, // Use the clean name.
      insights: [],
    };

    // Check for duplicates to prevent double saving (e.g., auto-save + manual save on exit)
    // We check if the EXACT same text already exists in the insights list.
    const isDuplicate = existingArchetype.insights.some(
        (insight) => insight.text === insightText
    );
    
    if (isDuplicate) {
        return; // Skip saving if identical text exists
    }

    const newInsight = {
      text: insightText,
      timestamp: Date.now(),
    };

    // Add the new insight
    const updatedInsights = [...existingArchetype.insights, newInsight];
    
    // Ensure we only keep the last 3 insights
    if (updatedInsights.length > 3) {
      existingArchetype.insights = updatedInsights.slice(-3);
    } else {
      existingArchetype.insights = updatedInsights;
    }

    // Update the main data object with the clean key.
    atlasData[key] = existingArchetype;

    // Save back to localStorage
    localStorage.setItem(ATLAS_STORAGE_KEY, JSON.stringify(atlasData));

  } catch (error) {
    console.error("Failed to save insight to localStorage", error);
  }
};