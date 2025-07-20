import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chainlinkService } from "./chainlink";

export async function registerRoutes(app: Express): Promise<Server> {
  // Chainlink Price API Routes
  app.get('/api/prices/bnb', async (req, res) => {
    try {
      const priceData = await chainlinkService.getBNBPrice();
      
      if (!priceData) {
        return res.status(503).json({
          error: 'Chainlink price feed unavailable',
          fallback: true,
          price: 725, // Static fallback
          source: 'Fallback',
          timestamp: Date.now()
        });
      }

      res.json(priceData);
    } catch (error) {
      console.error('BNB price API error:', error);
      res.status(500).json({
        error: 'Internal server error',
        fallback: true,
        price: 725,
        source: 'Fallback',
        timestamp: Date.now()
      });
    }
  });

  app.get('/api/prices/all', async (req, res) => {
    try {
      const allPrices = await chainlinkService.getAllPrices();
      
      res.json({
        success: true,
        data: {
          bnb: allPrices.bnb || {
            price: 725,
            source: 'Fallback',
            timestamp: Date.now()
          },
          bam: {
            price: 0.0000001,
            source: 'Contract Fixed Price',
            timestamp: Date.now()
          }
        },
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('All prices API error:', error);
      res.status(500).json({
        error: 'Internal server error',
        success: false,
        data: {
          bnb: { price: 725, source: 'Fallback', timestamp: Date.now() },
          bam: { price: 0.0000001, source: 'Contract Fixed Price', timestamp: Date.now() }
        }
      });
    }
  });

  app.get('/api/health/chainlink', async (req, res) => {
    try {
      const isHealthy = await chainlinkService.healthCheck();
      
      res.json({
        status: isHealthy ? 'healthy' : 'degraded',
        service: 'Chainlink Price Feeds',
        timestamp: Date.now(),
        details: isHealthy ? 'All systems operational' : 'Using fallback providers'
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        service: 'Chainlink Price Feeds',
        error: 'Health check failed',
        timestamp: Date.now()
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
