import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { chatWithRecommendations, searchWithVariations } from '../services/chat.js';
import Click from '../models/Click.js';

const router = express.Router();
const TOP_N = 5;

const FRIENDLY_ERROR = "Can't reach the server right now. Please try again in a moment.";

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { message, history = [], sessionId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const trimmed = message.trim();
    const { products, thinking, isFallback } = await searchWithVariations(trimmed, TOP_N);
    const reply = await chatWithRecommendations(
      trimmed,
      products,
      history.map((h) => ({ role: h.role, text: h.text })),
      isFallback
    );
    res.json({
      reply,
      products: products.map((p) => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        imageUrl: p.imageUrl,
        link: p.link,
        sellerName: p.userId?.name || p.userId?.email || 'Seller',
      })),
      thinking,
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(200).json({
      reply: FRIENDLY_ERROR,
      products: [],
      thinking: [],
    });
  }
});

router.post('/click', optionalAuth, async (req, res) => {
  try {
    const { productId, sessionId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'productId required' });
    }
    await Click.create({
      productId,
      userId: req.user?._id || null,
      source: 'chat',
      sessionId: sessionId || null,
    });
    res.json({ recorded: true });
  } catch (err) {
    res.status(200).json({ recorded: false });
  }
});

export default router;

//searchbar not working
//explore page where users can see all other users and their contact details
// hey for the final part, these are the things I need.
// 1) (PRIORITY) It still shows me barcelona jersey when i search for food, because there are only 3 products, 2 food and 1 barcelona jersey. The problem is, it is still showing me all products even if it only suggests the things I searched for.
// Here are the rules: a) If n items are found; if n>5 return top 5; else return the n matching products.
// b)if no product found say sorry and recommend 5 latest products

// 2) Show user name under each product in marketplace and also mention the seller in the chat.

// 3) The chat response is being very generic, it should be something that attracts the user towards the product(without explicitly stating it) instead of just saying something like, "yeah these are the products I found."

// 4) Users should be able to search products and sellers and view other sellers and add filtering for product category.

// 5) add a landing page for non logged in users and an about page. Make sure both looks amazingly attractive and are responsive and lag free.

// 6) For times when there are some error from the backend, like if the fallback llm also fails then instead of throwing a red error, just return a fixed response like, "Can't reach the server right now" or something like this. (Important)[Do this for all possible error cases throughout the site, consider adding a 404 not found redirect page too, in case users try to access the page that ain't there]

// 7) Add a professional footer with contact details. The navbar is not responsive, it doesn't change for android users, make sure to use an elegant looking sidebar that opens and collapse for android as well as desktop users, just make sure the destop user's sidebar must look like the open gpt and claude web ui has and for android it should be something like the e-commerce websites have

// 8)finally add a light theme which the users can decide to toggle between light and dark, for all pages