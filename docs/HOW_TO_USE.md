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
2. Look below the "🚧 Dashboard features coming in Phase 3" section
3. You should see "Current Rules (4)" or similar (the number shows how many rules you have)
4. Find your rule in the list and click to expand it
5. Verify:
   - ✅ Name is correct
   - ✅ All three conditions are listed
   - ✅ Decision shows "REVIEW"
   - ✅ Risk score shows "75/100"

**Troubleshooting**: If you see "⚠️ No rules file found":
- Stop the Streamlit app (press Ctrl+C in the terminal)
- Restart it: `cd streamlit && streamlit run app.py`
- Alternatively, open `config/rules_v1.yaml` in a text editor to verify your rule was saved

### Full Testing (Web App)

Test your rule with real transaction data using the Test Transactions page.

1. **Navigate to Test Transactions**:
   - Click "🧪 Test Transactions" in the sidebar

2. **Create test transactions** (choose one method):

   **Option A: Generate Random Transactions**
   - Click the "🎲 Generate Random" tab
   - Select how many transactions (3-5 recommended)
   - Click "🎲 Generate Transactions"
   - The app creates realistic random transactions for you

   **Option B: Create Manually**
   - Click the "✍️ Manual Entry" tab
   - Fill in the form:
     * Transaction Amount: `2500` (should trigger your rule)
     * Merchant Category: Select `electronics`
     * Account Age: `15` days (less than 30)
     * Leave other fields as defaults
   - Click "➕ Add Transaction"
   - Repeat to create more test cases

3. **Edit transactions (optional)**:
   - You'll see a table with all your transactions
   - Click any cell to edit the value
   - Try changing amounts or categories to test different scenarios

3.5. **Select which rules to test (optional)**:
   - Click "⚙️ Advanced: Select Rules to Test" to expand
   - By default, all rules are enabled
   - Uncheck rules you want to skip (useful for testing one rule at a time)
   - Use "Disable All" to test with only the DEFAULT rule

4. **Run the tests**:
   - Click "▶️ Run Tests" button
   - Wait a few seconds while the app evaluates

5. **Review results**:
   - Summary shows: How many ALLOWED / REVIEW / BLOCKED
   - Results table shows each transaction with color coding:
     * Green = ALLOWED
     * Yellow = REVIEW (your rule should show here)
     * Red = BLOCKED
   - Check the "Matched Rule" column to see which rule caught each transaction

6. **Get AI explanation (optional)**:
   - If you have an API key configured
   - Scroll down to "🤖 AI Explanations"
   - Select a transaction from the dropdown
   - Click "🤖 Get AI Explanation"
   - Read the detailed explanation of why it was flagged

---

## Understanding the Output

### Summary Metrics

At the top of the results, you'll see:
- **Total Tested**: How many transactions were evaluated
- **✅ ALLOWED**: Transactions approved (green)
- **⚠️ REVIEW**: Transactions flagged for manual review (yellow)
- **🚫 BLOCKED**: Transactions automatically declined (red)

### Results Table

Each row shows one transaction:

| Field | What It Means | Example |
|-------|---------------|---------|
| Transaction ID | Unique identifier | `txn_001`, `manual_001` |
| Decision | What happened to this transaction | `REVIEW` (yellow background) |
| Risk Score | Risk level from 0-100 | `75` (shown as progress bar) |
| Matched Rule | Which rule caught it | `Expensive electronics from new accounts` |
| Reason | Why this rule triggered | `High-value electronics purchase from new account` |

**Color coding:**
- 🟢 Green row = ALLOWED (low risk)
- 🟡 Yellow row = REVIEW (medium risk - needs your attention)
- 🔴 Red row = BLOCKED (high risk)

### AI Explanations (with API key)

If you request an AI explanation for a specific transaction, you'll see:

**AI Explanation:**
> This transaction was flagged for manual review because it involves a $2,500
> electronics purchase from an account that was created only 15 days ago. This
> pattern is often associated with fraudsters using stolen payment methods to
> buy high-value, easily resellable items like phones and laptops.

**Confidence:** 🟢 HIGH (or 🟡 MEDIUM, 🔴 LOW)

**Needs Review:** ✅ Yes (human analyst should investigate)

**Questions to Investigate:**
- Is the shipping address the same as the account registration address?
- Has the customer made any smaller "test" purchases before this one?
- Is the device used for this purchase the same as the registration device?

**Important:** The AI explanation describes WHY the rule triggered, but the decision itself comes from your deterministic rule - the AI never changes the outcome.

### Advanced: Jupyter Notebook Testing

For advanced users who need to test large batches of transactions (50+ at once), you can use the Jupyter notebook:

```bash
jupyter notebook notebooks/decision_engine.ipynb
```

The notebook allows you to:
- Generate hundreds of transactions at once
- Export results to CSV
- Run custom analysis on the data
- Batch generate LLM explanations for all flagged transactions

This is useful for performance testing or analyzing rule effectiveness across large datasets.

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

### "Can I test specific rules in isolation?"

**Yes!** Use the rule selection feature in the Test Transactions page.

1. Create your test transactions
2. Click "⚙️ Advanced: Select Rules to Test" (expander)
3. Uncheck rules you want to disable
4. Click "Run Tests"

**Use cases:**
- Test one rule at a time to verify it works correctly
- Compare results with/without a specific rule
- Debug rule interactions
- A/B test different rule configurations

**Quick controls:**
- "Enable All" - test with all rules (production simulation)
- "Disable All" - only DEFAULT rule runs (everything allowed)
- Individual checkboxes - custom combinations

**Important notes:**
- **DEFAULT rule always runs** - Cannot be disabled. It catches transactions that don't match any other rule.
  - Example: If you disable all custom rules, every transaction will match DEFAULT (usually ALLOW)
  - This ensures every transaction gets a decision
- **Rule selection is for testing only** - Production always uses all active rules in order

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
