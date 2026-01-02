import streamlit as st
import pandas as pd
import sys
from pathlib import Path
from typing import Dict, Any, List
import os
import tempfile
import yaml
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Add parent src to path for business_rules package
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from business_rules import RuleEngine, LLMExplainer, ConfigManager
from business_rules.data_generator import FraudDataGenerator

st.set_page_config(
    page_title="Test Transactions",
    page_icon="🧪",
    layout="wide"
)

# Initialize session state
if 'transactions' not in st.session_state:
    st.session_state.transactions = []
if 'results' not in st.session_state:
    st.session_state.results = None
if 'llm_explanations' not in st.session_state:
    st.session_state.llm_explanations = {}
# Note: Rule selection state is stored in individual checkbox keys like 'rule_select_RULE_001'

# Initialize managers
config_path = Path(__file__).parent.parent.parent / "config"
config_mgr = ConfigManager(str(config_path))
data_generator = FraudDataGenerator()

# Check for API key
has_api_key = bool(os.environ.get('ANTHROPIC_API_KEY'))

# Sidebar
with st.sidebar:
    st.title("🧪 Test Transactions")
    st.markdown("---")
    st.markdown("### Navigation")
    st.page_link("app.py", label="🔧 Rule Builder")
    st.page_link("pages/1_📊_Dashboard.py", label="📊 Dashboard")
    st.page_link("pages/2_🧪_Test_Transactions.py", label="🧪 Test Transactions", icon="🏠")
    st.page_link("pages/3_📜_Audit_Log.py", label="📜 Audit Log")

    st.markdown("---")
    st.markdown("### API Status")
    if has_api_key:
        st.success("✅ LLM explanations available")
    else:
        st.warning("⚠️ No API key - LLM explanations disabled")
        st.caption("Add ANTHROPIC_API_KEY to .env file")

# Main content
st.title("🧪 Test Transactions")
st.markdown("Test your fraud detection rules with sample or custom transactions.")

# Section 1: Input Method
st.header("1. Create Test Transactions")

tab1, tab2 = st.tabs(["🎲 Generate Random", "✍️ Manual Entry"])

with tab1:
    st.markdown("Generate random transactions to test your rules.")

    col1, col2 = st.columns([1, 3])

    with col1:
        num_transactions = st.number_input(
            "Number of transactions",
            min_value=1,
            max_value=10,
            value=5,
            step=1
        )

    with col2:
        if st.button("🎲 Generate Transactions", type="primary"):
            # Generate random transactions
            df = data_generator.generate_dataset(n=num_transactions)

            # Convert to list of dicts
            new_transactions = df.to_dict('records')

            # Add to session state
            st.session_state.transactions = new_transactions
            st.session_state.results = None  # Clear previous results
            st.session_state.llm_explanations = {}

            st.success(f"✅ Generated {num_transactions} random transactions")
            st.rerun()

with tab2:
    st.markdown("Manually create a transaction to test.")

    with st.form("manual_transaction_form"):
        col1, col2, col3 = st.columns(3)

        with col1:
            txn_amount = st.number_input(
                "Transaction Amount ($)",
                min_value=0.0,
                max_value=100000.0,
                value=1000.0,
                step=100.0
            )

            velocity = st.number_input(
                "Transactions in 24h",
                min_value=0,
                max_value=100,
                value=1,
                step=1
            )

        with col2:
            category = st.selectbox(
                "Merchant Category",
                options=["retail", "travel", "gambling", "crypto", "electronics"]
            )

            is_new_device = st.checkbox("New Device?", value=False)

        with col3:
            country_mismatch = st.checkbox("Country Mismatch?", value=False)

            account_age = st.number_input(
                "Account Age (days)",
                min_value=0,
                max_value=3650,
                value=90,
                step=1
            )

        submitted = st.form_submit_button("➕ Add Transaction", type="primary")

        if submitted:
            # Create transaction dict
            new_txn = {
                "transaction_id": f"manual_{len(st.session_state.transactions) + 1:03d}",
                "transaction_amount": txn_amount,
                "transaction_velocity_24h": velocity,
                "merchant_category": category,
                "is_new_device": is_new_device,
                "country_mismatch": country_mismatch,
                "account_age_days": account_age
            }

            st.session_state.transactions.append(new_txn)
            st.session_state.results = None  # Clear previous results
            st.session_state.llm_explanations = {}

            st.success("✅ Transaction added")
            st.rerun()

# Section 1.5: Rule Selection (Advanced)
if st.session_state.transactions:
    st.markdown("---")

    # Load available rules
    try:
        config = config_mgr.load_rules()
        all_rules = config.get('rules', [])

        # Filter out DEFAULT rule for display
        custom_rules = [r for r in all_rules if r.get('logic') != 'ALWAYS']
        default_rule = next((r for r in all_rules if r.get('logic') == 'ALWAYS'), None)

        # Initialize checkbox states if needed
        for rule in custom_rules:
            checkbox_key = f"rule_select_{rule['id']}"
            if checkbox_key not in st.session_state:
                st.session_state[checkbox_key] = True

        with st.expander("⚙️ Advanced: Select Rules to Test", expanded=False):
            st.markdown("**Test specific rules in isolation** (for debugging or A/B testing)")

            # Count enabled rules from checkbox states
            enabled_count = sum(1 for rule in custom_rules
                              if st.session_state.get(f"rule_select_{rule['id']}", True))
            total_custom = len(custom_rules)

            st.info(f"🎯 Currently testing with **{enabled_count}/{total_custom}** custom rules enabled (DEFAULT always runs)")

            # Quick action buttons
            col_btn1, col_btn2, col_btn3 = st.columns([1, 1, 2])

            with col_btn1:
                if st.button("✅ Enable All", key="enable_all_rules", use_container_width=True):
                    # Update checkbox states directly
                    for rule in custom_rules:
                        st.session_state[f"rule_select_{rule['id']}"] = True
                    st.rerun()

            with col_btn2:
                if st.button("❌ Disable All", key="disable_all_rules", use_container_width=True):
                    # Update checkbox states directly
                    for rule in custom_rules:
                        st.session_state[f"rule_select_{rule['id']}"] = False
                    st.rerun()

            st.markdown("---")
            st.markdown("**Select rules to include in testing:**")

            # Show checkboxes for each custom rule
            for idx, rule in enumerate(custom_rules):
                rule_id = rule['id']
                rule_name = rule.get('name', 'Unnamed')
                decision = rule.get('outcome', {}).get('decision', 'N/A')

                # Color badge for decision
                badge_color = {"ALLOW": "🟢", "REVIEW": "🟡", "BLOCK": "🔴"}.get(decision, "⚪")

                # Checkbox - state is automatically managed by Streamlit
                st.checkbox(
                    f"{badge_color} **{rule_name}** (`{rule_id}`) - {decision}",
                    key=f"rule_select_{rule_id}"
                )


    except Exception as e:
        st.error(f"Error loading rules: {str(e)}")

# Section 2: Transaction Table (Editable)
if st.session_state.transactions:
    st.markdown("---")
    st.header("2. Review & Edit Transactions")

    # Convert to DataFrame for editing
    df = pd.DataFrame(st.session_state.transactions)

    # Reorder columns for better display
    column_order = [
        "transaction_id",
        "transaction_amount",
        "transaction_velocity_24h",
        "merchant_category",
        "is_new_device",
        "country_mismatch",
        "account_age_days"
    ]

    # Only include columns that exist
    display_columns = [col for col in column_order if col in df.columns]
    df = df[display_columns]

    st.markdown(f"**{len(df)} transactions ready for testing**")

    # Editable data table
    edited_df = st.data_editor(
        df,
        use_container_width=True,
        num_rows="dynamic",
        column_config={
            "transaction_id": st.column_config.TextColumn("ID", disabled=True),
            "transaction_amount": st.column_config.NumberColumn("Amount ($)", format="$%.2f"),
            "transaction_velocity_24h": st.column_config.NumberColumn("Velocity (24h)", min_value=0),
            "merchant_category": st.column_config.SelectboxColumn(
                "Category",
                options=["retail", "travel", "gambling", "crypto", "electronics"]
            ),
            "is_new_device": st.column_config.CheckboxColumn("New Device"),
            "country_mismatch": st.column_config.CheckboxColumn("Foreign Country"),
            "account_age_days": st.column_config.NumberColumn("Account Age (days)", min_value=0)
        },
        hide_index=True
    )

    # Update session state with edited data
    st.session_state.transactions = edited_df.to_dict('records')

    # Action buttons
    col1, col2, col3 = st.columns([2, 1, 1])

    with col1:
        if st.button("🗑️ Clear All Transactions"):
            st.session_state.transactions = []
            st.session_state.results = None
            st.session_state.llm_explanations = {}
            st.rerun()

    with col3:
        if st.button("▶️ Run Tests", type="primary", disabled=len(st.session_state.transactions) == 0):
            with st.spinner("Running transactions through rule engine..."):
                try:
                    # Load full config
                    config = config_mgr.load_rules()
                    all_rules = config.get('rules', [])

                    # Filter rules based on checkbox selections
                    enabled_rules = [
                        rule for rule in all_rules
                        if rule.get('logic') == 'ALWAYS' or  # Always include DEFAULT
                           st.session_state.get(f"rule_select_{rule['id']}", True)
                    ]

                    # Check if any custom rules are enabled
                    custom_enabled = any(
                        st.session_state.get(f"rule_select_{rule['id']}", True)
                        for rule in all_rules if rule.get('logic') != 'ALWAYS'
                    )

                    if enabled_rules:

                        # Check if at least DEFAULT is present
                        if not any(r.get('logic') == 'ALWAYS' for r in enabled_rules):
                            st.error("❌ No rules enabled! Enable at least one rule to test.")
                            st.stop()

                        # Create temporary config with filtered rules
                        filtered_config = config.copy()
                        filtered_config['rules'] = enabled_rules

                        # Save to temporary file
                        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as tmp:
                            yaml.safe_dump(filtered_config, tmp, default_flow_style=False, sort_keys=False)
                            tmp_path = tmp.name

                        # Load rule engine with filtered config
                        engine = RuleEngine(tmp_path)

                        # Clean up temp file
                        os.unlink(tmp_path)
                    else:
                        # Use all rules (default behavior)
                        engine = RuleEngine(str(config_path / "rules_v1.yaml"))

                    # Evaluate transactions
                    results = engine.evaluate_batch(st.session_state.transactions)

                    # Store results
                    st.session_state.results = results

                    st.success("✅ Testing complete!")
                    st.rerun()

                except Exception as e:
                    st.error(f"Error running tests: {str(e)}")

# Section 3: Results Display
if st.session_state.results:
    st.markdown("---")
    st.header("3. Test Results")

    results = st.session_state.results

    # Summary statistics
    decisions = [r.decision for r in results]
    decision_counts = pd.Series(decisions).value_counts()

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Total Tested", len(results))

    with col2:
        allow_count = decision_counts.get('ALLOW', 0)
        st.metric("✅ ALLOWED", allow_count)

    with col3:
        review_count = decision_counts.get('REVIEW', 0)
        st.metric("⚠️ REVIEW", review_count)

    with col4:
        block_count = decision_counts.get('BLOCK', 0)
        st.metric("🚫 BLOCKED", block_count)

    st.markdown("---")

    # Results table
    results_data = []
    for result in results:
        results_data.append({
            "Transaction ID": result.transaction_id,
            "Decision": result.decision,
            "Risk Score": result.risk_score,
            "Matched Rule": result.matched_rule_name,
            "Reason": result.rule_reason
        })

    results_df = pd.DataFrame(results_data)

    # Color-code decisions
    def highlight_decision(row):
        if row['Decision'] == 'BLOCK':
            return ['background-color: #ffebee'] * len(row)
        elif row['Decision'] == 'REVIEW':
            return ['background-color: #fff9c4'] * len(row)
        else:
            return ['background-color: #e8f5e9'] * len(row)

    styled_df = results_df.style.apply(highlight_decision, axis=1)

    st.dataframe(
        styled_df,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Risk Score": st.column_config.ProgressColumn(
                "Risk Score",
                format="%d/100",
                min_value=0,
                max_value=100
            )
        }
    )

    # LLM Explanations Section (Optional)
    if has_api_key:
        st.markdown("---")
        st.subheader("🤖 AI Explanations (Optional)")
        st.markdown("Get detailed AI-generated explanations for specific transactions.")

        # Transaction selector
        txn_ids = [r.transaction_id for r in results]
        selected_txn = st.selectbox(
            "Select transaction for AI explanation",
            options=txn_ids,
            key="txn_selector"
        )

        if st.button("🤖 Get AI Explanation", key="get_explanation"):
            with st.spinner("Generating AI explanation..."):
                try:
                    # Find the transaction and result
                    txn = next(t for t in st.session_state.transactions if t['transaction_id'] == selected_txn)
                    result = next(r for r in results if r.transaction_id == selected_txn)

                    # Generate explanation
                    explainer = LLMExplainer()
                    explanation = explainer.generate_explanation(txn, result)

                    # Store in session state
                    st.session_state.llm_explanations[selected_txn] = explanation

                    st.rerun()

                except Exception as e:
                    st.error(f"Error generating explanation: {str(e)}")

        # Display explanation if exists
        if selected_txn in st.session_state.llm_explanations:
            explanation = st.session_state.llm_explanations[selected_txn]

            st.markdown("#### AI Explanation")
            st.info(explanation.human_readable_explanation)

            col1, col2 = st.columns(2)
            with col1:
                confidence_color = {
                    "HIGH": "🟢",
                    "MEDIUM": "🟡",
                    "LOW": "🔴"
                }
                st.markdown(f"**Confidence:** {confidence_color.get(explanation.confidence, '⚪')} {explanation.confidence}")

            with col2:
                review_status = "✅ Yes" if explanation.needs_human_review else "❌ No"
                st.markdown(f"**Needs Review:** {review_status}")

            if explanation.clarifying_questions:
                st.markdown("**Questions to Investigate:**")
                for q in explanation.clarifying_questions:
                    st.markdown(f"- {q}")

            if explanation.additional_context:
                with st.expander("Additional Context"):
                    st.markdown(explanation.additional_context)

    else:
        st.markdown("---")
        st.info("💡 **Tip:** Add your ANTHROPIC_API_KEY to the `.env` file to enable AI-powered explanations.")

else:
    if st.session_state.transactions:
        st.info("👆 Click 'Run Tests' above to evaluate your transactions")
    else:
        st.info("👆 Create some test transactions above to get started")

# Footer
st.markdown("---")
st.caption("🤖 Fraud Detection Testing | Results are deterministic - LLM only explains, never decides")
