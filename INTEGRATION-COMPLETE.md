# Write Like Webex - Full Integration Complete! 🎉

## What Was Built

### Backend API (Cloudflare Worker)
**Repository**: https://github.com/yankundesign/webex-writer-backend  
**Live API**: https://webex-writer-backend.yankunux.workers.dev/api/generate-variants

#### Features:
- ✅ Real Webex Voice & Tone guidelines from `guidelines-v1.json`
- ✅ OpenAI GPT-4o-mini integration
- ✅ Intent-based prompt generation (CTA, tooltip, error, etc.)
- ✅ Audience-aware tone (general, end-user, IT admins)
- ✅ Returns 3 variants with rationale and applied rule IDs
- ✅ Full CORS support for Figma plugin

#### Components:
- `src/guidelines.ts` - Parses guidelines and filters relevant rules
- `src/prompt-builder.ts` - Builds contextual prompts
- `src/openai.ts` - GPT-4o-mini integration
- `src/index.ts` - Main API endpoint

### Figma Plugin Updates
**Repository**: https://github.com/yankundesign/WLW-Figma

#### Changes:
- ✅ Integrated real API calls to backend
- ✅ Loading states ("Generating..." button)
- ✅ Error handling with fallback to mock LLM
- ✅ Toast notifications for offline mode
- ✅ Async/await pattern for API calls

#### How It Works:
1. User selects text layer in Figma
2. User chooses intent, audience, and optional instructions
3. Click "Generate" → calls real API with Webex guidelines
4. Receives 3 variants with rationale and applied rules
5. User can edit, compare, and apply variants to text layer
6. History is tracked per node

## Testing the Integration

### In Figma Desktop:
1. Open Figma Desktop
2. Go to Plugins → Development → Import plugin from manifest
3. Select `/Users/yankunwang/WLW-Figma/manifest.json`
4. Run the plugin
5. Select a text layer
6. Click "Generate" - should see "Generating..." then real AI-generated variants!

### Expected Behavior:
- Button shows "Generating..." during API call
- Takes 3-8 seconds to generate variants
- Returns 3 distinct variants following Webex voice
- Each variant shows rationale and applied rule IDs (e.g., `rule-short_ctas`)
- If API fails, falls back to mock with warning toast

## API Examples

### Test with curl:
```bash
curl -X POST https://webex-writer-backend.yankunux.workers.dev/api/generate-variants \
  -H "Content-Type: application/json" \
  -d '{
    "originalText": "Click here to get started now please",
    "intent": "cta",
    "audience": "end-user",
    "instructions": "Make it friendlier"
  }'
```

### Response:
```json
{
  "variants": [
    {
      "text": "Start your journey here",
      "rationale": "Direct, benefit-focused CTA...",
      "appliedRules": ["rule-short_ctas", "voice-action_oriented"]
    },
    // ... 2 more variants
  ]
}
```

## Intent Mapping

The backend automatically selects relevant guidelines based on intent:

- **cta** → Short CTAs, imperative steps, benefit-first
- **tooltip** → Benefit headlines, feature outcomes
- **error** → Calm error tone, actionable steps
- **helper** → Feature context, imperative steps
- **label** → Sentence case headings
- **dialog-title** → Sentence case, benefit-first

## Cost & Performance

### Cloudflare Workers
- **Free tier**: 100,000 requests/day
- **Response time**: Instant routing

### OpenAI GPT-4o-mini
- **Cost per call**: ~$0.0045 (3 variants)
- **Monthly estimate**: $10-30 for moderate use
- **Response time**: 3-8 seconds

### Total Cost
- **Development/Testing**: ~$1-5/month
- **Production (1000 calls/month)**: ~$5-10/month
- **Heavy use (10,000 calls/month)**: ~$50-100/month

## File Structure

```
WLW-Figma/                          # Figma Plugin
├── code.ts                         # Plugin logic
├── ui.html                         # UI with API integration ✨
├── manifest.json                   # Plugin manifest
└── code.js                         # Compiled output

webex-writer-backend/               # Backend API
├── src/
│   ├── index.ts                    # API endpoint
│   ├── guidelines.ts               # Guidelines parser
│   ├── prompt-builder.ts           # Prompt generation
│   └── openai.ts                   # OpenAI integration
├── guidelines-v1.json              # Webex guidelines ✨
├── wrangler.jsonc                  # Cloudflare config
└── .dev.vars                       # Local API key (gitignored)
```

## Monitoring & Logs

### Cloudflare Dashboard
- View requests: https://dash.cloudflare.com/workers
- Live logs: `cd webex-writer-backend && npx wrangler tail`

### OpenAI Usage
- Monitor costs: https://platform.openai.com/usage
- Set spending limits in OpenAI dashboard

## Troubleshooting

### "Using offline mode" message
- Backend is down or unreachable
- OpenAI API key issues
- Check logs: `npx wrangler tail`

### Slow generation (>10 seconds)
- Normal for first cold start
- Subsequent calls should be 3-8 seconds
- Check OpenAI status page if persistent

### "Server configuration error"
- OpenAI API key not set
- Run: `cd webex-writer-backend && npx wrangler secret put OPENAI_API_KEY`

## Next Steps (Optional Enhancements)

1. **Custom domains**: Add your own domain instead of workers.dev
2. **Analytics**: Track popular intents and usage patterns
3. **A/B testing**: Experiment with different prompt strategies
4. **Batch mode**: Generate variants for multiple text layers at once
5. **Style guide export**: Generate PDF/HTML style guide from guidelines
6. **RAG integration**: Add vector search for more specific guideline examples
7. **Multi-language**: Extend guidelines for localization

## Success Metrics

✅ Real API deployed and accessible  
✅ Figma plugin integrated with API  
✅ Fallback mechanism for offline mode  
✅ Loading states and error handling  
✅ Using actual Webex guidelines  
✅ Intent and audience awareness  
✅ Rule traceability (shows which rules applied)  
✅ GitHub repositories created  
✅ Documentation complete  

---

## 🎊 You're all set!

Your Figma plugin now uses real AI with authentic Webex Voice & Tone guidelines. Every generated variant follows the exact same principles that Webex writers use, and you can see exactly which rules were applied.

**Try it now in Figma!** 🚀

