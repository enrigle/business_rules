# Fraud Detection Rules - Quick Start Guide

**For fraud analysts**: This guide shows you how to create and test fraud detection rules using a simple web interface.

---

## Getting Started

### One-Time Setup

1. **Install the application** (ask your IT team if you need help):
   ```bash
   pip install -e ".[streamlit,dev]"
   ```

2. **Set up AI explanations** (optional but recommended):
   - Create a file named `.env` in the project folder
   - Add this line: `ANTHROPIC_API_KEY=your-api-key-here`
   - Replace `your-api-key-here` with your actual API key
   - (Without this, you'll still see which rule matched, but won't get human-readable explanations)

3. **Start the application**:
   ```bash
   cd streamlit
   streamlit run app.py
   ```

4. **Open your browser** to: http://localhost:8501

---

## Example: Add Your First Rule

Let's create a rule that flags expensive electronics purchases from new accounts for manual review.

**Scenario**: You want to review any electronics purchase over $2,000 from accounts less than 30 days old.

### Step 1: Open Rule Builder

- Click on "🔧 Rule Builder" in the sidebar
- You'll see a 4-step wizard

### Step 2: Name Your Rule

- **Rule ID**: Auto-generated (e.g., `RULE_004`) - don't change this
- **Rule Name**: Type `Expensive electronics from new accounts`
- Click "Next Step →"

### Step 3: Add Conditions

Add three conditions by filling out the form and clicking "➕ Add Condition" each time:

**Condition 1:**
- Field: `transaction_amount`
- Operator: `>`
- Value: `2000`
- Click "➕ Add Condition"

**Condition 2:**
- Field: `merchant_category`
- Operator: `==`
- Value: `electronics` (select from dropdown)
- Click "➕ Add Condition"

**Condition 3:**
- Field: `account_age_days`
- Operator: `<`
- Value: `30`
- Click "➕ Add Condition"

You should now see all three conditions listed. Click "Next Step →"

### Step 4: Set Logic and Outcome

**Logic section:**
- Select `AND` (all three conditions must be true)

**Outcome section:**
- Decision: Select `REVIEW` (send to human reviewer)
- Risk Score: Set to `75` (medium-high risk)
- Reason: Type `High-value electronics purchase from new account`

Click "Next Step →"

### Step 5: Preview and Save

- Review the summary on the left
- Check the YAML preview on the right
- If everything looks good, click "💾 Save Rule"
- You'll see a success message with confetti!

**What just happened?**
The app saved this rule to `config/rules_v1.yaml`:

```yaml
- id: "RULE_004"
  name: "Expensive electronics from new accounts"
  conditions:
    - field: "transaction_amount"
      operator: ">"
      value: 2000
    - field: "merchant_category"
      operator: "=="
      value: "electronics"
    - field: "account_age_days"
      operator: "<"
      value: 30
  logic: "AND"
  outcome:
    risk_score: 75
    decision: "REVIEW"
    reason: "High-value electronics purchase from new account"
```

---

## How to Test Your Rule

### Quick Verification (Dashboard)

1. Click "📊 Dashboard" in the sidebar
2. Scroll down to see all your rules
3. Find your rule in the list and click to expand it
4. Verify:
   - ✅ Name is correct
   - ✅ All three conditions are listed
   - ✅ Decision shows "REVIEW"
   - ✅ Risk score shows "75/100"

### Full Testing (Jupyter Notebook)

**Note**: The Test Transactions page in the web app is coming soon. For now, use the Jupyter notebook to test with real data.

1. **Open the notebook**:
   ```bash
   jupyter notebook notebooks/decision_engine.ipynb
   ```

2. **Run the setup cells** (first 3 cells):
   - Click the first cell and press Shift+Enter
   - Repeat for cells 2 and 3
   - This loads the rules and creates test data

3. **Find the test transaction section**:
   - Look for the cell that says "Generate test transactions"
   - Run it to create 50 sample transactions

4. **Run the evaluation cells**:
   - The notebook will process all transactions through your rules
   - Results appear in a table below

5. **Look for your rule**:
   - Find rows where "Matched Rule" shows your rule name
   - Check the "Decision" column shows "REVIEW"
   - Check the "Risk Score" column shows "75"

---

## Understanding the Output

When a transaction matches your rule, you'll see:

### Without AI Explanation (no API key):
```
Transaction: txn_12345
Matched Rule: Expensive electronics from new accounts
Decision: REVIEW
Risk Score: 75/100
Reason: High-value electronics purchase from new account
```

### With AI Explanation (API key configured):
```
Transaction: txn_12345
Matched Rule: Expensive electronics from new accounts
Decision: REVIEW
Risk Score: 75/100
Reason: High-value electronics purchase from new account

AI Explanation:
This transaction was flagged for manual review because it involves a $2,500
electronics purchase from an account that was created only 15 days ago. This
pattern is often associated with fraudsters using stolen payment methods to
buy high-value, easily resellable items like phones and laptops.

Confidence: HIGH
Needs Human Review: Yes

Questions to investigate:
- Is the shipping address the same as the account registration address?
- Has the customer made any smaller "test" purchases before this one?
- Is the device used for this purchase the same as the registration device?
```

**Key fields explained:**
- **Matched Rule**: Which rule caught this transaction (first match wins)
- **Decision**: ALLOW (approve), REVIEW (flag for you), or BLOCK (auto-decline)
- **Risk Score**: 0-100 (higher = riskier)
- **AI Explanation**: Plain English explanation of why this is suspicious
- **Confidence**: How sure the AI is about its explanation (not the decision)
- **Questions**: Suggested investigation steps for your review

---

## FAQ

### "My rule isn't triggering when I test it"

**Check rule order**: Rules are checked top-to-bottom. The first rule that matches wins and stops checking.

To view rule order:
1. Go to Dashboard
2. Rules are listed in order (1, 2, 3, etc.)
3. Your rule should be BEFORE the "DEFAULT" rule

If your rule is after DEFAULT, it will never run because DEFAULT catches everything.

To fix: Open `config/rules_v1.yaml` in a text editor and move your rule above the DEFAULT rule.

---

### "What's the difference between AND vs OR?"

**AND** = ALL conditions must be true (stricter)
- Use when you want multiple things to be true at the same time
- Example: Amount over $2000 AND electronics AND new account
- Transaction must meet all three criteria

**OR** = ANY condition can be true (broader)
- Use when you want to catch multiple separate patterns
- Example: Category is gambling OR category is crypto
- Transaction only needs to match one

---

### "How do I know if my API key is working?"

Two ways to check:

**Method 1**: Look at the output
- If you see "AI Explanation:" with detailed text → API key works ✅
- If you only see "Reason:" → API key missing or invalid ❌

**Method 2**: Check the `.env` file
1. Open the `.env` file in the project root
2. Look for the line: `ANTHROPIC_API_KEY=...`
3. Make sure there's a key after the `=` sign
4. Restart the Streamlit app after adding the key

---

### "Can I edit a rule after saving it?"

**Currently**: You need to edit the YAML file directly
1. Open `config/rules_v1.yaml` in a text editor
2. Find your rule by searching for its name or ID
3. Make your changes
4. Save the file
5. Refresh the Dashboard to see changes

**Coming soon**: The web app will have an "Edit Rule" button in the Dashboard.

---

### "What if I want to delete a rule?"

1. Open `config/rules_v1.yaml` in a text editor
2. Find your rule (search for the rule name or ID)
3. Delete the entire rule block (from `- id:` to the end of the `reason:` line)
4. Save the file
5. **Important**: Don't delete the DEFAULT rule - it's required

---

### "I see an error: 'No DEFAULT rule found'"

Every rule file must have a DEFAULT rule at the end that catches all transactions that don't match other rules.

**Fix**: Add this to the end of `config/rules_v1.yaml`:

```yaml
- id: "DEFAULT"
  name: "Default - Allow"
  conditions: []
  logic: "ALWAYS"
  outcome:
    risk_score: 10
    decision: "ALLOW"
    reason: "No risk indicators detected"
```

---

## Available Transaction Fields

When creating rules, you can check these fields:

| Field Name | What It Checks | Example Values |
|------------|---------------|----------------|
| `transaction_amount` | Dollar amount of transaction | `500`, `2000`, `10000` |
| `transaction_velocity_24h` | Number of transactions in last 24 hours | `1`, `5`, `15` |
| `merchant_category` | Type of merchant | `electronics`, `gambling`, `crypto`, `retail`, `travel` |
| `is_new_device` | Is this a device we haven't seen before? | `true` or `false` |
| `country_mismatch` | Is transaction from different country than account? | `true` or `false` |
| `account_age_days` | How old is the account (in days)? | `1`, `30`, `365` |

**Operators you can use:**
- Numbers: `>` (greater than), `<` (less than), `>=`, `<=`, `==` (equals)
- Text: `==` (equals), `!=` (not equals)
- True/False: `==` (equals)

---

## Quick Tips

✅ **Do this:**
- Test your rules with sample data before using in production
- Use descriptive rule names (makes debugging easier)
- Start with REVIEW instead of BLOCK until you're confident
- Put most specific rules first (closer to the top)

❌ **Avoid this:**
- Don't delete the DEFAULT rule
- Don't put your rules after DEFAULT
- Don't use risk score 90+ unless you're certain (auto-blocks are permanent)
- Don't forget to save the YAML file before testing

---

## Need More Help?

- **View existing rules**: Check `config/rules_v1.yaml` for examples
- **Ask your team**: Share the rule YAML for review before deploying
- **Test thoroughly**: Use the Jupyter notebook to test with various transaction amounts and patterns
