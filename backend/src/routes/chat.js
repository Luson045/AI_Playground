import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { chatWithRecommendations, searchWithVariations } from '../services/chat.js';
import Click from '../models/Click.js';

const router = express.Router();
const TOP_N = 24;
const CHAT_TOP_N = 5;

const FRIENDLY_ERROR = "Can't reach the server right now. Please try again in a moment.";

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { message, history = [], sessionId, contextProducts = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const trimmed = message.trim();
    const normalizeContextProducts = (list) =>
      Array.isArray(list)
        ? list.map((p) => ({
          _id: p._id,
          name: p.name,
          description: p.description,
          category: p.category,
          price: p.price,
          imageUrl: p.imageUrl,
          link: p.link,
          userId: { name: p.sellerName || p.userId?.name || p.userId?.email || 'Seller' },
        }))
        : [];

    const parsePriceFilter = (text) => {
      const lower = text.toLowerCase();
      const nums = lower.match(/\d+(\.\d+)?/g)?.map((n) => Number(n)) || [];
      if (/(cheapest|lowest|least|most affordable)/i.test(lower)) return { type: 'cheapest' };
      if (/between/i.test(lower) && nums.length >= 2) {
        return { type: 'range', min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
      }
      if (/(under|below|less than|within)/i.test(lower) && nums.length >= 1) {
        return { type: 'max', max: nums[0] };
      }
      if (/(over|above|more than|at least)/i.test(lower) && nums.length >= 1) {
        return { type: 'min', min: nums[0] };
      }
      return null;
    };

    const applyPriceFilter = (list, filter) => {
      if (!filter || !Array.isArray(list) || list.length === 0) return list;
      const items = list
        .map((p) => ({ ...p, _price: Number(p.price) }))
        .filter((p) => Number.isFinite(p._price));
      if (items.length === 0) return list;
      if (filter.type === 'cheapest') {
        items.sort((a, b) => a._price - b._price);
        return [items[0]];
      }
      if (filter.type === 'range') return items.filter((p) => p._price >= filter.min && p._price <= filter.max);
      if (filter.type === 'max') return items.filter((p) => p._price <= filter.max);
      if (filter.type === 'min') return items.filter((p) => p._price >= filter.min);
      return items;
    };

    const priceFilter = parsePriceFilter(trimmed);
    let products = [];
    let thinking = [];
    let isFallback = false;

    if (priceFilter && Array.isArray(contextProducts) && contextProducts.length) {
      const normalized = normalizeContextProducts(contextProducts);
      const filtered = applyPriceFilter(normalized, priceFilter);
      if (filtered.length > 0) {
        products = filtered.slice(0, TOP_N);
        thinking = [{ type: 'filter', message: 'Filtered from previous results.' }, { type: 'done', totalFound: products.length }];
      }
    }

    if (products.length === 0) {
      const searchResult = await searchWithVariations(
        trimmed,
        TOP_N,
        req.user?._id || null,
        history.map((h) => ({ role: h.role, text: h.text }))
      );
      products = searchResult.products;
      thinking = searchResult.thinking;
      isFallback = searchResult.isFallback;
    }
    if (products.length > TOP_N) products = products.slice(0, TOP_N);
    const topForChat = products.slice(0, CHAT_TOP_N);
    const reply = await chatWithRecommendations(
      trimmed,
      topForChat,
      history.map((h) => ({ role: h.role, text: h.text })),
      isFallback
    );
    const topOrder = new Map(topForChat.map((p, i) => [String(p._id), i]));
    products = products.slice().sort((a, b) => {
      const aRank = topOrder.has(String(a._id)) ? topOrder.get(String(a._id)) : 999;
      const bRank = topOrder.has(String(b._id)) ? topOrder.get(String(b._id)) : 999;
      if (aRank !== bRank) return aRank - bRank;
      return 0;
    });
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
