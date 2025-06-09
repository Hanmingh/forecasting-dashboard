import { useState, useEffect } from 'react';

interface FavoriteProduct {
  product: string;
  addedAt: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('forecast-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  const addToFavorites = (product: string) => {
    const newFavorite: FavoriteProduct = {
      product,
      addedAt: new Date().toISOString(),
    };
    const updatedFavorites = [...favorites, newFavorite];
    setFavorites(updatedFavorites);
    localStorage.setItem('forecast-favorites', JSON.stringify(updatedFavorites));
  };

  const removeFromFavorites = (product: string) => {
    const updatedFavorites = favorites.filter(f => f.product !== product);
    setFavorites(updatedFavorites);
    localStorage.setItem('forecast-favorites', JSON.stringify(updatedFavorites));
  };

  const isFavorite = (product: string) => {
    return favorites.some(f => f.product === product);
  };

  const toggleFavorite = (product: string) => {
    if (isFavorite(product)) {
      removeFromFavorites(product);
    } else {
      addToFavorites(product);
    }
  };

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
  };
}; 