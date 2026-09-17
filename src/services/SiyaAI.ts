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
Your mission is to guide the user in choosing how to allocate their savings between building passive income (Time Freedom) and paying down debts (Reducing Slavery).
The user has savings of ${savingsAmount} and the following debts:
${debtDetails}

You must evaluate:
1. Passive Income Generation: How they can invest their savings to generate passive income.
2. Debt Clearance: How paying down these specific debts reduces their "Slavery Days" (interest and debt burden).
3. The hybrid path: Investing savings to generate passive income, and routing that passive income to pay off the debt.

Provide a highly customized, encouraging, and sharp financial response. Use bold points, short paragraphs, and high-energy tone. Include:
- A clear recommendation on the ratio of savings to invest vs. pay down debt.
- Step-by-step action items for the "Passive Income" strategy.
- Step-by-step action items for the "Debt Clearance" strategy.
- Keep the response clean and format as valid markdown.
Return a JSON object in the following format:
{
  "recommendation": "Markdown formatted string containing your detailed response, recommendations, action steps, and analysis."
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
  
  let recText = `### 🌟 Siya's Sovereignty Plan\n\n`;
  
  if (totalDebt === 0) {
    recText += `**Congratulations! You are currently free from debt slavery!**\n\nSince you have no active debts, **100% of your savings (${savingsAmount.toLocaleString()})** should be funneled into building **Passive Income (Time Freedom)**.\n\n`;
    recText += `#### 📈 Action Items for Time Freedom:\n`;
    recText += `1. **Emergency Shield**: Set aside 3-6 months of expenses in a High Yield Savings Account (yielding ~5% return).\n`;
    recText += `2. **Index Fund Core**: Put 60% of the remaining savings into low-cost Broad Market Index Funds (targeting 8-10% CAGR).\n`;
    recText += `3. **Sovereignty Assets**: Look into high-yield dividend stocks or sovereign bonds for cashflow generation.`;
  } else {
    recText += `You have **${debts.length} active debts** totaling **${totalDebt.toLocaleString()}**, against **${savingsAmount.toLocaleString()}** in savings.\n\n`;
    
    if (savingsAmount > totalDebt) {
      recText += `**Sovereignty Alert:** Your savings exceed your total debt! You have the power to buy back your freedom immediately.\n\n`;
      recText += `#### 🛡️ Siya's Recommended Strategy:\n`;
      recText += `- **Kill the Slavery (Debt)**: Allocate **${totalDebt.toLocaleString()}** to wipe out all debts immediately. This decreases your debt slavery days to **0** and terminates interest bleed.\n`;
      recText += `- **Time Freedom (Passive)**: Put the remaining **${(savingsAmount - totalDebt).toLocaleString()}** into high-yield passive assets to start generating recurring cash flow.`;
    } else {
      recText += `#### 🛡️ Siya's Hybrid Strategy (Sovereignty Boost):\n`;
      recText += `Instead of draining all your cash, we will execute a **hybrid asset-velocity strategy**:\n\n`;
      recText += `1. **Leverage the Passive Side**: Invest **50% of savings (${(savingsAmount * 0.5).toLocaleString()})** into income-producing assets (e.g. index funds or dividend shares yielding ~8-10%). This grows your asset column.\n`;
      recText += `2. **Sovereignty Debt Boost**: Take the passive income generated, add it to your monthly debt payment, and target the debt with the highest interest rate (Avalanche Method). This speeds up your debt-free date and saves you valuable days of slavery!\n`;
      recText += `3. **Cash Reserve**: Keep **50% (${(savingsAmount * 0.5).toLocaleString()})** as a liquid buffer so you never have to take on high-interest debt again in an emergency.`;
    }
  }
  
  return { recommendation: recText };
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

