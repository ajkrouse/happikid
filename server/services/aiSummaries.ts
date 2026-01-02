import OpenAI from "openai";
import type { Provider } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface AISummaryResult {
  summary: string;
  highlights: string[];
  followUpSuggestions: string[];
}

function formatProviderForContext(provider: Provider): string {
  const parts = [
    `**${provider.name}**`,
    `Type: ${provider.type || 'Childcare'}`,
    `Location: ${provider.city}, ${provider.state}`,
  ];
  
  if (provider.ageRangeMin !== undefined && provider.ageRangeMax !== undefined) {
    const minYears = Math.floor(provider.ageRangeMin / 12);
    const maxYears = Math.floor(provider.ageRangeMax / 12);
    parts.push(`Ages: ${minYears}-${maxYears} years`);
  }
  
  if (provider.monthlyPrice) {
    parts.push(`Price: $${provider.monthlyPrice}/month`);
  }
  
  if (provider.features && provider.features.length > 0) {
    parts.push(`Features: ${provider.features.slice(0, 5).join(', ')}`);
  }
  
  if (provider.rating && Number(provider.rating) > 0) {
    parts.push(`Rating: ${provider.rating}/5`);
  }
  
  if (provider.isVerifiedByGov) {
    parts.push(`✓ Government Verified`);
  }
  
  return parts.join(' | ');
}

export async function generateSearchSummary(
  query: string,
  providers: Provider[],
  parsedContext?: { matchedTerms: string[]; confidence: number }
): Promise<AISummaryResult | null> {
  if (!providers || providers.length === 0) {
    return {
      summary: `I couldn't find any providers matching "${query}". Try adjusting your search criteria or exploring different locations.`,
      highlights: [],
      followUpSuggestions: [
        "Try a broader search term",
        "Search in a nearby location",
        "Remove some filters"
      ]
    };
  }

  const topProviders = providers.slice(0, 5);
  const providerContext = topProviders.map((p, i) => `${i + 1}. ${formatProviderForContext(p)}`).join('\n');
  
  const systemPrompt = `You are HappiKid's friendly childcare assistant. You help parents find the best childcare options in NY, NJ, and CT. Be warm, helpful, and concise.

Guidelines:
- Summarize the search results in 2-3 sentences
- Highlight key differentiators between providers
- Be encouraging and supportive
- Focus on what matters to parents: safety, quality, convenience
- Keep responses under 150 words`;

  const userPrompt = `A parent searched for: "${query}"

Here are the top matching providers:
${providerContext}

Total results found: ${providers.length}

Please provide:
1. A friendly summary of these options (2-3 sentences)
2. 2-3 key highlights or patterns you notice
3. 2-3 follow-up questions the parent might want to explore`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = parseAIResponse(content);
    return parsed;
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return null;
  }
}

function parseAIResponse(content: string): AISummaryResult {
  const lines = content.split('\n').filter(line => line.trim());
  
  let summary = '';
  const highlights: string[] = [];
  const followUpSuggestions: string[] = [];
  
  let currentSection = 'summary';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.toLowerCase().includes('highlight') || 
        trimmedLine.toLowerCase().includes('pattern') ||
        trimmedLine.toLowerCase().includes('key point')) {
      currentSection = 'highlights';
      continue;
    }
    
    if (trimmedLine.toLowerCase().includes('follow-up') || 
        trimmedLine.toLowerCase().includes('question') ||
        trimmedLine.toLowerCase().includes('explore')) {
      currentSection = 'suggestions';
      continue;
    }
    
    const bulletMatch = trimmedLine.match(/^[-•*\d.]+\s*(.+)/);
    const textContent = bulletMatch ? bulletMatch[1] : trimmedLine;
    
    if (currentSection === 'summary' && !trimmedLine.startsWith('-') && !trimmedLine.match(/^\d+\./)) {
      summary += (summary ? ' ' : '') + textContent;
    } else if (currentSection === 'highlights' && textContent && !textContent.toLowerCase().includes('highlight')) {
      highlights.push(textContent);
    } else if (currentSection === 'suggestions' && textContent && !textContent.toLowerCase().includes('follow')) {
      followUpSuggestions.push(textContent);
    }
  }
  
  if (!summary && lines.length > 0) {
    summary = lines.slice(0, 2).join(' ');
  }
  
  return {
    summary: summary || 'Here are the top matching providers based on your search.',
    highlights: highlights.slice(0, 3),
    followUpSuggestions: followUpSuggestions.slice(0, 3)
  };
}

export async function generateProviderComparison(
  providers: Provider[]
): Promise<string | null> {
  if (providers.length < 2) {
    return null;
  }

  const providerContext = providers.map((p, i) => `${i + 1}. ${formatProviderForContext(p)}`).join('\n');
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are HappiKid's childcare assistant. Compare these providers concisely, highlighting key differences that matter to parents. Keep it under 100 words." 
        },
        { 
          role: "user", 
          content: `Compare these providers:\n${providerContext}` 
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("Error generating comparison:", error);
    return null;
  }
}
