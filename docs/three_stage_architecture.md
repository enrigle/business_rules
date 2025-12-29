flowchart TB
    subgraph Stage1["Stage 1: Jupyter Notebook"]
        D1[CSV/JSON Data] --> R1[Rule Engine]
        R1 --> S1[Scores + Decisions]
        S1 --> L1[LLM Explainer]
        L1 --> O1[Output + Reasons]
        L1 -.->|confidence < 0.8| Q1[Clarifying Questions]
    end

    subgraph Stage2["Stage 2: Streamlit App"]
        U2[File Upload UI] --> V2[Data Validator]
        V2 --> R2[Rule Engine]
        R2 --> S2[Scores + Decisions]
        S2 --> L2[LLM Explainer]
        L2 --> O2[Results Dashboard]
        C2[YAML Config Editor] --> R2
    end

    subgraph Stage3["Stage 3: Production App"]
        U3[File Upload] --> V3[Validator]
        V3 --> R3[Rule Engine]
        R3 --> S3[Scores]
        S3 --> L3[LLM Agent]
        L3 -->|HIGH confidence| O3[Auto-approve]
        L3 -->|LOW/MEDIUM| H3[Human Review Queue]
        H3 --> A3[Approver Decision]
        A3 --> O3[Final Output]
        DB3[(SQLite)] --> R3
        DB3 --> H3
    end

    Stage1 --> Stage2 --> Stage3