graph TD
    A["User sends French message"] --> B["AI analyzes and responds"]
    B --> C["MistakeTracker parses AI response"]
    C --> D{"Mistakes found?"}
    
    D -->|Yes| E["Extract mistake details"]
    D -->|No| F["Continue conversation"]
    
    E --> G["Categorize mistake type"]
    G --> H["Determine severity level"]
    H --> I["Store in UserMistakes table"]
    I --> J["Update MistakePatterns table"]
    J --> K["Calculate improvement metrics"]
    
    K --> L["Update LearningSession"]
    L --> M["Generate focus areas"]
    M --> N["Provide personalized feedback"]
    
    subgraph "Mistake Categories"
        O["Grammar<br/>- Verb conjugation<br/>- Gender/number agreement<br/>- Article usage<br/>- Tense selection"]
        P["Vocabulary<br/>- Word choice<br/>- False friends<br/>- Anglicisms<br/>- Register"]
        Q["Syntax<br/>- Word order<br/>- Question formation<br/>- Negation<br/>- Relative pronouns"]
        R["Orthography<br/>- Accents<br/>- Homophones<br/>- Capitalization"]
        S["Pronunciation<br/>- Liaison<br/>- Silent letters<br/>- Nasal sounds"]
        T["Pragmatic<br/>- Politeness<br/>- Discourse markers"]
        U["Cultural<br/>- Context appropriateness<br/>- Regional variations"]
    end
    
    G --> O
    G --> P
    G --> Q
    G --> R
    G --> S
    G --> T
    G --> U

## 🎉 **Comprehensive Mistake Tracking System**

The mistake tracking system evaluates users across **7 key dimensions** and provides personalized learning analytics. Here's what we've built:

## **📊 Evaluation Dimensions:**

### **1. Grammar Mistakes**
- **Verb conjugation**: `je mange → je mangé`
- **Gender/number agreement**: `une chat → un chat`
- **Article usage**: `le eau → l'eau`
- **Tense selection**: `hier je mange → hier j'ai mangé`
- **Subjunctive**: `il faut que je vais → il faut que j'aille`
- **Prepositions**: `penser sur → penser à`

### **2. Vocabulary Mistakes**
- **Word choice**: `Je suis excité → Je suis enthousiaste`
- **False friends**: `actuellement → currently`
- **Anglicisms**: `parking → stationnement`
- **Register**: Using "tu" in formal context

### **3. Syntax Mistakes**
- **Word order**: `Rouge voiture → Voiture rouge`
- **Question formation**: `Comment tu appelles? → Comment tu t'appelles?`
- **Negation**: `Je pas mange → Je ne mange pas`
- **Relative pronouns**: Complex pronoun usage

### **4. Orthography Mistakes**
- **Accents**: `cafe → café`
- **Homophones**: `a/à`, `et/est`, `son/sont`
- **Capitalization**: `Français → français`

### **5. Pronunciation Mistakes** *(Future speech integration)*
- **Liaison**: `les_amis`, `nous_avons`
- **Silent letters**: Silent "h" in "heure"
- **Nasal sounds**: `bon, blanc, brun`

### **6. Pragmatic Mistakes**
- **Politeness level**: Not using "s'il vous plaît"
- **Discourse markers**: Missing "alors", "donc"

### **7. Cultural Mistakes**
- **Cultural context**: Inappropriate cultural references
- **Regional variations**: Mixing Quebec/Metropolitan French

## **🛠️ System Architecture:**

### **Database Schema:**
- **`userMistakes`**: Individual mistake records
- **`mistakePatterns`**: Aggregated mistake frequency and trends
- **`learningSessions`**: Session-based analytics
- **Enhanced `conversationSessions`**: Mistake breakdowns per session

### **AI Integration:**
- **Enhanced Amélie persona** with detailed correction instructions
- **Structured mistake format** for consistent parsing
- **Severity classification** (minor/moderate/major)
- **Contextual explanations** in French and English

### **Analytics Features:**
- **Mistake frequency tracking** by category
- **Improvement trends** over time
- **Focus area identification** for targeted practice
- **Repeated mistake detection** for intervention
- **Mastery level calculation** per category

## **🚀 Key Features:**

1. **Real-time mistake detection** as users chat with Amélie
2. **Comprehensive mistake taxonomy** covering all French learning aspects
3. **Personalized feedback** based on individual mistake patterns
4. **Progress tracking** with improvement metrics
5. **Focus area recommendations** for efficient learning
6. **Spaced repetition integration** for mistake remediation

## **📈 User Benefits:**

- **Targeted learning**: Focus on actual problem areas
- **Progress visualization**: See improvement over time
- **Mistake prevention**: Learn from repeated errors
- **Comprehensive feedback**: Multi-dimensional evaluation
- **Adaptive difficulty**: System learns user's level

The system is **production-ready** and will automatically start tracking mistakes once users begin conversing with Amélie! 🇫🇷✨