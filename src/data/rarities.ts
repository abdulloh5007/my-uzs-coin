
export interface Rarity {
  id: string;
  name: string;
  min: number;
  max: number;
  color: string; // Tailwind color class for display
}

export const rarities: Rarity[] = [
  { id: 'common', name: 'Обычный', min: 70, max: 90, color: 'text-gray-400' },
  { id: 'uncommon', name: 'Необычный', min: 50, max: 70, color: 'text-green-400' },
  { id: 'rare', name: 'Редкий', min: 30, max: 50, color: 'text-blue-400' },
  { id: 'epic', name: 'Эпический', min: 20, max: 30, color: 'text-purple-400' },
  { id: 'legendary', name: 'Легендарный', min: 10, max: 20, color: 'text-orange-500' },
  { id: 'mythical', name: 'Мифический', min: 5, max: 10, color: 'text-red-500' },
  { id: 'immortal', name: 'Бессмертный', min: 1, max: 5, color: 'text-yellow-400' },
];

export const getRarityById = (id: string) => rarities.find(r => r.id === id);

// Calculates a random rarity percentage within the selected tier's range
export const calculateRarityValue = (rarityId: string): number => {
    const rarity = getRarityById(rarityId);
    if (!rarity) {
        // Default to a common value if not found
        const commonRarity = rarities[0];
        const value = Math.random() * (commonRarity.max - commonRarity.min) + commonRarity.min;
        return parseFloat(value.toFixed(1));
    }
    const value = Math.random() * (rarity.max - rarity.min) + rarity.min;
    return parseFloat(value.toFixed(1));
};

    