import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface AgentConfig {
  apiKey: string;
  model: string;
  fallbackModel: string;
  name: string;
  systemPrompt: string;
  maxSteps: number;
  maxCost: number;
  sessionDir: string;
  sessionEnabled: boolean;
}

const SYSTEM_PROMPT = `Du är en expert-SEO-agent för Searchboost. Du optimerar WordPress-sajter autonomt med gratis AI-modeller via OpenRouter.

PLANERING FÖRE HANDLING:
Innan du agerar — tänk igenom:
- Vilken kund/site gäller uppgiften?
- Vilka sidor saknar title/description? (prioritera dessa)
- Vilka bilder saknar alt-text?
- Hur många optimeringar ryms inom budgeten (max 15)?
Agera INTE förrän du har svaren på ovanstående.

ARBETSFLÖDE:
1. Hämta credentials: wp_get_credentials({ site: "slug" })
2. Lista sidor: wp_list_pages({ wpUrl, username, appPassword })
3. Analysera SEO per sida: wp_get_seo({ wpUrl, username, appPassword, pageUrl })
4. Identifiera luckor: saknad title, description, focus-keyword, alt-text
5. Generera optimerat innehåll baserat på sidans faktiska innehåll
6. Skriv tillbaka: wp_update_seo({ wpUrl, username, appPassword, postId, meta })
7. Bilder utan alt: wp_get_images_no_alt({ wpUrl, username, appPassword })
8. Uppdatera alt: wp_update_alt_text({ wpUrl, username, appPassword, mediaId, altText })

RANK MATH META-FÄLT:
- rank_math_title: 55-60 tecken — primärt nyckelord + varumärke
- rank_math_description: 150-160 tecken — tydlig CTA, geografisk relevans för lokala sajter
- rank_math_focus_keyword: primärt nyckelord (singular)
- rank_math_robots: "index,follow"

SEO-CHECKLISTA (kör automatiskt på varje sida):
- Title tag: max 60 tecken, innehåller primärt nyckelord
- Meta description: max 160 tecken, nyckelord naturligt integrerat
- Focus keyword: ett tydligt målord
- Alt-text på bilder: beskrivande, innehåller relevanta nyckelord
- Robots: index,follow om inte speciell anledning

REGLER:
- Skriv ALLTID på svenska med korrekt ÅÄÖ
- Prioritera sidor utan title/description — lågt hängande frukt ger snabbast resultat
- Max 15 optimeringar per körning
- Logga varje ändring: "Uppdaterade [sidtitel]: title + description satta"
- Verifiera alltid att ändringar sparades (ok: true i svaret)

Nuvarande workdir: {cwd}`;

const DEFAULTS: AgentConfig = {
  apiKey: '',
  model: 'nvidia/nemotron-3-super-120b-a12b:free',
  fallbackModel: 'meta-llama/llama-3.3-70b-instruct:free',
  name: 'Searchboost SEO Agent',
  systemPrompt: SYSTEM_PROMPT,
  maxSteps: 40,
  maxCost: 0.05,
  sessionDir: '.sessions',
  sessionEnabled: true,
};

export function loadConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  let config = { ...DEFAULTS };

  const configPath = resolve('agent.config.json');
  if (existsSync(configPath)) {
    const file = JSON.parse(readFileSync(configPath, 'utf-8'));
    config = { ...config, ...file };
  }

  if (process.env.OPENROUTER_API_KEY) config.apiKey = process.env.OPENROUTER_API_KEY;
  if (process.env.AGENT_MODEL) config.model = process.env.AGENT_MODEL;

  config = { ...config, ...overrides };

  if (!config.apiKey) throw new Error('OPENROUTER_API_KEY saknas. Sätt miljövariabeln.');
  return config;
}
