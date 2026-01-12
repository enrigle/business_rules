# Fraud Detection Rules - Quick Start Guide

**For fraud analysts**: This guide shows you how to create and test fraud detection rules using a visual flowchart editor.

---

## Getting Started

### One-Time Setup

1. **Install the application** (ask your IT team if you need help):
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt
   pip install --no-deps -e .

   # Install React frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

2. **Set up AI explanations** (optional but recommended):
   - Create a file named `.env` in the project folder
   - Add this line: `ANTHROPIC_API_KEY=your-api-key-here`
   - Replace `your-api-key-here` with your actual API key
   - (Without this, you'll still see which rule matched, but won't get human-readable explanations)

3. **Start the backend API**:
   ```bash
   cd backend
   python main.py
   ```
   Backend runs at http://localhost:8000

4. **Start the React frontend** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs at http://localhost:5173

5. **Open your browser** to: http://localhost:5173

---

## Using the Visual Flow Editor

### Navigate to the Flow Editor

1. Open http://localhost:5173 in your browser
2. You'll see the Dashboard with rule statistics
3. Click **"Visual Rule Editor"** in the navigation

### Understanding the Flow Diagram

When the editor loads, you'll see a flowchart with:

**Node Types:**
- **Blue nodes** (top) = Transaction Input - shows the data fields being evaluated
- **Orange/Pink nodes** = Condition Groups - shows AND/OR logic with the actual conditions
- **Purple nodes** = Rule Cards - displays the rule name, matched outcome, and decision
- **Green/Yellow/Red nodes** (bottom) = Decision Outputs - final ALLOW/REVIEW/BLOCK outcomes

**Flow Direction:**
- Rules flow **top to bottom** (first match wins)
- "Match" edges point down to the decision
- "No match" edges point right to the next rule
- The **DEFAULT** rule is always last and catches everything

### Example: Add Your First Rule

Let's create a rule that flags expensive electronics purchases from new accounts for manual review.

**Scenario**: You want to review any electronics purchase over $2,000 from accounts less than 30 days old.

### Step 1: Click "New Rule"

- Click the **"+ New Rule"** button in the top toolbar
- A side panel opens on the right

### Step 2: Name Your Rule

- **Rule Name**: Type `Expensive electronics from new accounts`
- The Rule ID is auto-generated (e.g., `RULE_010`)

### Step 3: Add Conditions

Click **"+ Add"** under the Conditions section for each condition:

**Condition 1:**
- Field: `transaction_amount`
- Operator: `>`
- Value: `2000`

**Condition 2:**
- Field: `merchant_category`
- Operator: `==`
- Value: `electronics` (select from dropdown)

**Condition 3:**
- Field: `account_age_days`
- Operator: `<`
- Value: `30`

You should now see all three conditions listed in the panel.

### Step 4: Set Logic

- **Logic**: Select `AND` (all three conditions must be true)
- This appears between your conditions in the panel

### Step 5: Set Outcome

**Outcome section:**
- **Decision**: Click the `REVIEW` button (yellow badge)
- **Risk Score**: Drag the slider to `75`
- **Reason**: Type `High-value electronics purchase from new account`

### Step 6: Save

- Click the **"Create"** button at the bottom of the panel
- The new rule appears in the flowchart automatically
- You'll see it positioned before the DEFAULT rule

**What just happened?**
The app saved this rule to `config/rules_v1.yaml` and created a backup:

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

### Visual Testing with Live Evaluation

The Flow Editor has a built-in **Test Transaction** panel for instant rule testing.

### Step 1: Open Test Panel

- Click the **"🧪 Test Transaction"** button in the top-right corner of the flow editor
- A test panel appears with a transaction form

### Step 2: Enter Test Data

You can either:

**Option A: Enter manually**
- Amount: `2500`
- Velocity (24h): `2`
- Merchant Category: Select `electronics`
- Check **"New Device"** box: ✓
- Uncheck "Country Mismatch"

**Option B: Generate random**
- Click **"🎲 Random"** button
- The form fills with realistic random values
- Adjust values to match your test scenario

### Step 3: Run Evaluation

- Click **"▶ Evaluate"** button
- Wait 1-2 seconds for processing

### Step 4: View Results

The flowchart **highlights the matching path in green**:
- Transaction Input node glows green
- Matched Condition Group glows green
- Matched Rule Card glows green
- Decision Output (REVIEW/ALLOW/BLOCK) glows green

**Result box shows:**
- **Decision**: REVIEW (yellow badge)
- **Risk Score**: 75
- **Matched Rule**: Expensive electronics from new accounts

### Step 5: Test Different Scenarios

Try these variations to verify your rule works correctly:

**Should trigger REVIEW (match your rule):**
- Amount: $2500, Category: electronics, Account Age: 15 days → ✓ REVIEW

**Should NOT trigger REVIEW (no match):**
- Amount: $1500, Category: electronics, Account Age: 15 days → ✗ (amount too low)
- Amount: $2500, Category: retail, Account Age: 15 days → ✗ (wrong category)
- Amount: $2500, Category: electronics, Account Age: 60 days → ✗ (account too old)

For each test:
1. Modify the transaction values
2. Click "▶ Evaluate"
3. Check which rule lights up
4. Click "Clear Highlights" to reset

### Dashboard Verification

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

**To view rule order in the Visual Editor:**
1. Navigate to the **Visual Rule Editor**
2. Look at the flowchart - rules flow top to bottom
3. Your rule should be BEFORE the "DEFAULT" rule
4. If another rule appears first and matches, yours won't run

**To reorder rules:**
1. In the Visual Editor, **drag any rule node vertically** (up or down)
2. Release the mouse - the rule moves to the new position
3. An **"Unsaved changes"** badge appears in the top bar
4. Click **"Save Order"** button to persist the new order
5. The flowchart rebuilds with the new sequence
6. Changes saved to `config/rules_v1.yaml`

**Tips:**
- More specific rules should be higher (checked first)
- Broader catch-all rules should be lower
- DEFAULT must always be last (cannot be moved)
- If you drag a rule too low, it may never trigger

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

**Yes!** Use the visual editor:

1. Navigate to the **Visual Rule Editor**
2. **Click on any purple rule node** in the flowchart
3. The edit panel opens on the right with the rule details
4. Make your changes:
   - Update conditions (add, remove, modify)
   - Change logic (AND → OR)
   - Adjust risk score
   - Modify decision (ALLOW → REVIEW → BLOCK)
   - Update reason text
5. Click **"Save"** button
6. The flowchart updates automatically
7. Changes are saved to `config/rules_v1.yaml` with automatic backup

**Note**: The DEFAULT rule opens in read-only mode and cannot be edited or deleted.

---

### "What if I want to delete a rule?"

**Use the visual editor:**

1. Navigate to the **Visual Rule Editor**
2. **Click on the rule node** you want to delete
3. The edit panel opens on the right
4. Click the **"Delete"** button at the bottom
5. Confirm the deletion when prompted
6. The rule disappears from the flowchart
7. Changes saved to `config/rules_v1.yaml` with automatic backup

**Important**:
- The DEFAULT rule **cannot be deleted** (required for system to function)
- Deleted rules are backed up in `config/backups/` with timestamp
- To restore a deleted rule, check the backup files

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
