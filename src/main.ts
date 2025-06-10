import { Game } from './game';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Get the game container element
    const container = document.getElementById('game-container');
    const loadingElement = document.getElementById('loading');
    
    if (!container) {
        console.error('Game container not found!');
        return;
    }
    
    try {
        // Initialize the game
        const game = new Game(container);
        
        // Start the game animation loop
        game.animate();
        
        // Hide loading message
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            game.handleResize();
        });
        
        // Handle cleanup on page unload
        window.addEventListener('beforeunload', () => {
            game.dispose();
        });
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        if (loadingElement) {
            loadingElement.textContent = 'Failed to load game. Please refresh the page.';
        }
    }
});