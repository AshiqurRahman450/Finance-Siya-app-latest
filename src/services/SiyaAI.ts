let activeGeminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || ''; // User must set this in .env or settings

export const setGeminiApiKey = (key) => {
  activeGeminiApiKey = key.trim();
};

export const getGeminiApiKey = () => {
  return activeGeminiApiKey;
};

export const scanReceiptWithGemini = async (base64Image, mimeType = 'image/jpeg') => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("No Gemini API Key configured.");
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptText = `Analyze this Google Pay or UPI transaction receipt screenshot.
Extract:
1. "amount": The exact numeric transaction amount (e.g. "150.00"). Do NOT include the rupee symbol or commas.
2. "merchant": The exact merchant or recipient name (e.g. "Ashraf N").
3. "category": Choose one of: Food, Rent, Salary, Freelance, Entertainment, Shopping, Transport, Other.
4. "type": "expense" or "income" (usually "expense").

Guidelines:
- Identify the transaction amount, which is typically the large bold number in the center of the receipt (e.g. 150, 90809, etc.).
- Do NOT mix up the amount with phone numbers (like +91 90809 01239), dates, years (like 2025), or transaction IDs (like 509248704875).
- If the amount is not clear, locate any text like "Paid ₹...", "Sent ₹...", or similar.
- Return ONLY valid JSON in this format:
{
  "amount": "...",
  "merchant": "...",
  "category": "...",
  "type": "..."
}
Do not include markdown formatting or backticks. Return JSON only.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.candidates[0].content.parts[0].text;
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Gemini OCR Error:", err);
    throw err;
  }
};

export const auditExpense = async (input, freedomGoal = 10000000) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn("No EXPO_PUBLIC_GEMINI_API_KEY found. Using mock Siya AI response.");
    return new Promise(resolve => setTimeout(() => resolve(mockAudit(input, freedomGoal)), 1500));
  }
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const systemInstruction = `You are Siya, the Sovereignty Guardian of Project 22.
Your mission is to maximize the child’s financial independence by Age 23.
When the user submits an expense:
Extract: amount (number only), item
Categorize: category (Food, Apparel, Household, Education, Health, Transport, Investment, Entertainment, Other)
Classify: type: Need or Waste
A Need improves survival, education, health, or productive capacity.
A Waste is consumption, vanity, impulse, luxury, or non-essential spending.
If Waste: Calculate future value at 12% CAGR for 18 years. Convert financial loss into "freedomDaysLost" using formula: freedomDaysLost = futureValue / (freedomGoal / 365). Round properly.
If Need: futureValue = 0, freedomDaysLost = 0.
Generate a short emotional but rational nudge in the user's selected language.
Determine sovereigntyImpact: "Positive" for Need, "Negative" for Waste.
Return ONLY valid JSON in this format:
{
"amount": number,
"item": string,
"category": string,
"type": "Need" or "Waste",
"futureValue": number,
"freedomDaysLost": number,
"sovereigntyImpact": "Positive" or "Negative",
"aiNudge": string
}
Do not include markdown. Do not include explanations. Return JSON only.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: { text: systemInstruction } },
        contents: [{ parts: [{ text: `Expense: ${input}\nFreedom Goal: ${freedomGoal}` }] }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.candidates[0].content.parts[0].text;
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Gemini Error:", err);
    return fallbackAudit(input, freedomGoal);
  }
};

const calculateWasteMath = (amount, freedomGoal) => {
  const futureValue = amount * Math.pow(1.12, 18);
  const dailyGoal = freedomGoal / 365;
  const freedomDaysLost = futureValue / dailyGoal;
  return { futureValue: Math.round(futureValue), freedomDaysLost: Math.round(freedomDaysLost) };
};

const mockAudit = (input, freedomGoal) => {
  const lower = input.toLowerCase();
  const isWaste = lower.includes('dress') || lower.includes('silk') || lower.includes('party') || lower.includes('chain') || lower.includes('gold') || lower.includes('watch') || lower.includes('toy') || lower.includes('movie') || lower.includes('ticket');
  const type = isWaste ? "Waste" : "Need";
  
  // Extract number roughly
  const match = input.match(/\d+/);
  const amount = match ? parseInt(match[0], 10) : (isWaste ? 500 : 150);
  
  const { futureValue, freedomDaysLost } = isWaste ? calculateWasteMath(amount, freedomGoal) : { futureValue: 0, freedomDaysLost: 0 };
  
  return {
    amount,
    item: isWaste ? (lower.includes('watch') ? 'Luxury Watch' : "Luxury item") : "Essential item",
    category: isWaste ? "Apparel" : "Food",
    type,
    futureValue,
    freedomDaysLost: freedomDaysLost > 0 ? freedomDaysLost.toFixed(1) : 0,
    sovereigntyImpact: isWaste ? "Negative" : "Positive",
    aiNudge: isWaste 
      ? `A $${amount} luxury now costs ${freedomDaysLost.toFixed(1)} days of your child's freedom later. Is vanity worth their time?`
      : `Good. Essentials build the foundation. Keep optimizing.`
  };
};

const fallbackAudit = (input, freedomGoal) => {
  return {
    amount: 0,
    item: input,
    category: "Other",
    type: "Waste",
    futureValue: 0,
    freedomDaysLost: 0,
    sovereigntyImpact: "Negative",
    aiNudge: "AI processing failed. Expense recorded as raw string."
  };
};

export const getSiyaSavingsVsDebtRecommendation = async (savingsAmount: number, debts: any[]) => {
  const apiKey = getGeminiApiKey();
  const debtDetails = debts.map(d => `${d.title || 'Unnamed debt'}: Remaining ${d.remaining || '0'}, Monthly payment: ${d.monthly || '0'}`).join('\n');
  
  if (!apiKey) {
    console.warn("No EXPO_PUBLIC_GEMINI_API_KEY found. Using mock Siya recommendation.");
    return new Promise<{ recommendation: string }>(resolve => setTimeout(() => resolve(mockSavingsVsDebtRec(savingsAmount, debts)), 1500));
  }
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const systemInstruction = `You are Siya, the Sovereignty Guardian.
Your mission is to guide the user on allocating savings (${savingsAmount}) against their debts:
${debtDetails}

Provide a short, sweet, and punchy recommendation.
CRITICAL RULES:
- Keep the entire response to a MAXIMUM of 5 short lines.
- Be extremely concise but highly encouraging and sharp.
- Give a quick verdict on how much to invest vs. pay down debt.

Return a JSON object in the following format:
{
  "recommendation": "Short 5-line markdown string with your punchy advice."
}
Return JSON only. Do not include markdown wraps around the JSON itself.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: { text: systemInstruction } },
        contents: [{ parts: [{ text: `Generate my custom plan based on my savings of ${savingsAmount} and my debts.` }] }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.candidates[0].content.parts[0].text;
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Gemini Error:", err);
    return { recommendation: fallbackSavingsVsDebtRec(savingsAmount, debts) };
  }
};

const mockSavingsVsDebtRec = (savingsAmount: number, debts: any[]): { recommendation: string } => {
  const totalDebt = debts.reduce((sum, d) => sum + (parseFloat(d.remaining?.toString().replace(/[^0-9.-]+/g,"")) || 0), 0);
  
  if (totalDebt === 0) {
    return { recommendation: `**You are free from debt slavery!**\nFunnel 100% of your ${savingsAmount.toLocaleString()} savings into Passive Income.\nKeep 3 months of cash in a HYSA.\nInvest the rest into low-cost Broad Market Index Funds.\nLet your money buy back your time!` };
  }
  
  if (savingsAmount > totalDebt) {
    return { recommendation: `**Sovereignty Alert: You can buy back your freedom!**\nWipe out your ${totalDebt.toLocaleString()} debt immediately to stop the interest bleed.\nTake the remaining ${(savingsAmount - totalDebt).toLocaleString()} and invest in high-yield passive assets.\nZero debt means zero slavery.` };
  }

  return { recommendation: `**Hybrid Sovereignty Strategy!**\nInvest 50% (${(savingsAmount * 0.5).toLocaleString()}) in income-producing assets (~8-10% yield).\nKeep 50% as a liquid emergency shield.\nUse the passive income generated to aggressively attack your highest interest debt!` };
};

const fallbackSavingsVsDebtRec = (savingsAmount: number, debts: any[]): string => {
  return mockSavingsVsDebtRec(savingsAmount, debts).recommendation;
};

export const auditExpenseWithAudio = async (base64Audio: string, mimeType: string = 'audio/x-m4a', freedomGoal = 10000000) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn("No EXPO_PUBLIC_GEMINI_API_KEY found. Using mock voice audit.");
    return new Promise(resolve => setTimeout(() => resolve(mockAudit("Spent 500 on Luxury Watch", freedomGoal)), 1500));
  }
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const systemInstruction = `You are Siya, the Sovereignty Guardian of Project 22.
Your mission is to maximize the child’s financial independence by Age 23.
Analyze the audio segment of the user saying what they spent money on.
Extract: amount (number only), item
Categorize: category (Food, Apparel, Household, Education, Health, Transport, Investment, Entertainment, Other)
Classify: type: Need or Waste
A Need improves survival, education, health, or productive capacity.
A Waste is consumption, vanity, impulse, luxury, or non-essential spending.
If Waste: Calculate future value at 12% CAGR for 18 years. Convert financial loss into "freedomDaysLost" using formula: freedomDaysLost = futureValue / (freedomGoal / 365). Round properly.
If Need: futureValue = 0, freedomDaysLost = 0.
Generate a short emotional but rational nudge in the user's selected language.
Determine sovereigntyImpact: "Positive" for Need, "Negative" for Waste.
Return ONLY valid JSON in this format:
{
"amount": number,
"item": string,
"category": string,
"type": "Need" or "Waste",
"futureValue": number,
"freedomDaysLost": number,
"sovereigntyImpact": "Positive" or "Negative",
"aiNudge": string
}
Do not include markdown. Do not include explanations. Return JSON only.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: { text: systemInstruction } },
        contents: [{
          parts: [
            { text: `Analyze this audio spend recording. Freedom Goal: ${freedomGoal}` },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Audio
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.candidates[0].content.parts[0].text;
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Gemini Audio Error:", err);
    return fallbackAudit("Voice recording analysis failed.", freedomGoal);
  }
};

export const getSiyaIncomeImprovementSuggestions = async (spendingData: any, totalIncome: number) => {
  const apiKey = getGeminiApiKey();
  const foodSpend = parseFloat(spendingData.food) || 0;
  const clothesSpend = parseFloat(spendingData.clothes) || 0;
  const travelSpend = parseFloat(spendingData.travel) || 0;
  const rentSpend = parseFloat(spendingData.rent) || 0;
  const otherSpend = parseFloat(spendingData.other) || 0;
  const loanSpend = parseFloat(spendingData.loan) || 0;
  const totalSpend = foodSpend + clothesSpend + travelSpend + rentSpend + otherSpend + loanSpend;
  
  const spendingDetails = `Food: ₹${foodSpend}, Clothes: ₹${clothesSpend}, Travel: ₹${travelSpend}, Rent: ₹${rentSpend}, Loan & EMI: ₹${loanSpend}, Other: ₹${otherSpend} (Total regular spending: ₹${totalSpend})`;

  if (!apiKey) {
    console.warn("No EXPO_PUBLIC_GEMINI_API_KEY found. Using mock Siya income suggestions.");
    return new Promise<{ suggestions: string }>(resolve => {
      setTimeout(() => {
        resolve({ suggestions: mockIncomeImprovementSuggestions(spendingDetails, totalIncome, totalSpend) });
      }, 1500);
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `You are Siya, the Sovereignty Guardian.
Your mission is to analyze the user's monthly regular survival spending:
${spendingDetails}
And their current total monthly income: ₹${totalIncome}

Generate 3 to 4 specific, actionable, and premium financial suggestions on how they can improve and increase their income to help cover their expenses, build passive assets, and gain time freedom.
Format the suggestions in markdown. Include bold bullet points, clear steps, and keep the tone optimistic, sharp, and highly motivating.
Return ONLY a valid JSON object in this format:
{
  "suggestions": "Markdown formatted suggestions here"
}
Do not return backticks, markdown wrapper, or extra text. Return JSON only.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: { text: systemInstruction } },
        contents: [{ parts: [{ text: `Provide my custom income improvement recommendations based on my survival spending: ${spendingDetails} and current income: ₹${totalIncome}` }] }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.candidates[0].content.parts[0].text;
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Gemini suggestions error:", err);
    return { suggestions: fallbackIncomeImprovementSuggestions(spendingDetails, totalIncome, totalSpend) };
  }
};

const mockIncomeImprovementSuggestions = (spendingDetails: string, totalIncome: number, totalSpend: number): string => {
  let rec = `### 💡 Siya AI's Sovereignty Plan to Scale Income\n\n`;
  rec += `Your monthly survival spending is **₹${totalSpend.toLocaleString()}**, against an active monthly income of **₹${totalIncome.toLocaleString()}**.\n\n`;
  
  if (totalSpend > totalIncome) {
    rec += `⚠️ **Urgent Sovereignty Warning:** Your monthly spending exceeds your current income! You are bleeding cash every month, which deepens debt slavery. We must immediately scale your income using the following pathways:\n\n`;
  } else {
    rec += `📈 You have a positive cash flow of **₹${(totalIncome - totalSpend).toLocaleString()}/month**. To accelerate your journey to complete financial sovereignty, let's boost your income channels:\n\n`;
  }

  rec += `#### 1. 🚀 Monetize a High-Value Skill (Freelance Portfolio)
- **Action Step**: Evaluate your high-value skills (like software development, UI/UX design, or sales). Start dedicated outreach on Upwork or Fiverr targeting premium clients.
- **Income Potential**: Extra **₹20,000 - ₹50,000/month** working 10 hours a week.

#### 2. 🏠 Create a Digital Asset Column
- **Action Step**: Write an e-book, launch a subscription-based newsletter, or compile a coding guide. These digital products take time to build once, but generate 100% passive royalties.
- **Income Potential**: Passive **₹10,000 - ₹25,000/month**.

#### 3. 💼 Optimize Your Primary Earned Income
- **Action Step**: Prepare a clear audit of your achievements at your current job. Schedule a review with your manager and request a cost-of-living raise or salary adjustment matching market value.
- **Income Potential**: Immediate permanent raise of **15% - 25%**.

#### 4. 💰 Rent/Leverage Underutilized Assets
- **Action Step**: If you own a vehicle or property, look into peer-to-peer renting services. Otherwise, park your liquid cash reserves in High Yield Savings Accounts (HYSA) to earn interest income.
- **Income Potential**: Extra **₹5,000/month** in interest/rent cashflow.`;

  return rec;
};

const fallbackIncomeImprovementSuggestions = (spendingDetails: string, totalIncome: number, totalSpend: number): string => {
  return mockIncomeImprovementSuggestions(spendingDetails, totalIncome, totalSpend);
};

