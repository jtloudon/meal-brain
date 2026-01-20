export interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
  category: string;
}

export const faqData: FAQItem[] = [
  // Getting Started
  {
    question: 'What is MealBrain?',
    answer: 'MealBrain is a household meal planning and grocery management app with an AI sous chef assistant. Think of it as your kitchen\'s command center - manage recipes, plan meals, create smart grocery lists, and get AI-powered cooking help, all in one place.',
    category: 'Getting Started',
  },
  {
    question: 'How do I add my first recipe?',
    answer: 'You have three ways to add recipes: (1) Snap a photo of a recipe card or cookbook page - AI extracts the details, (2) Paste a URL from your favorite cooking website - we auto-import everything, or (3) Manually enter it using our simple form. All three methods get you to the same result: a fully structured recipe ready to use.',
    category: 'Getting Started',
  },

  // AI Sous Chef
  {
    question: 'What is the Sous Chef?',
    answer: 'The Sous Chef is your AI cooking assistant, powered by Claude. It\'s the differentiator that makes MealBrain unique - you get expert help with recipe questions, meal planning, substitutions, and cooking techniques, all while maintaining full control over your kitchen decisions.',
    category: 'AI Sous Chef',
  },
  {
    question: 'How do I use the Sous Chef?',
    answer: 'Tap the chat icon in the main navigation to open the Sous Chef. Ask natural questions like "What can I make with chicken and rice?" or "How do I substitute buttermilk?" The AI understands your household\'s recipes and preferences, giving you personalized suggestions.',
    category: 'AI Sous Chef',
  },
  {
    question: 'What can the Sous Chef help me with?',
    answer: 'The Sous Chef excels at recipe suggestions based on what you have, ingredient substitutions, cooking technique questions, meal planning ideas, and understanding your existing recipes. It\'s trained to be helpful without being bossy - you stay in control of your kitchen.',
    category: 'AI Sous Chef',
  },

  // Adding Recipes
  {
    question: 'How do I add a recipe from a photo?',
    answer: 'Go to Recipes → New Recipe, choose "Photo" and either snap a picture or upload one from your library. Our AI (Claude Vision) reads handwritten recipes, printed cards, cookbook pages, even screenshots. It extracts ingredients, instructions, cook times, and more automatically.',
    category: 'Adding Recipes',
  },
  {
    question: 'How do I import a recipe from a URL?',
    answer: 'On the New Recipe page, choose "URL Import" and paste a link from any recipe website. MealBrain reads the structured recipe data (most sites use standard markup) and imports title, ingredients, instructions, times, and serving size in seconds.',
    category: 'Adding Recipes',
  },
  {
    question: 'How do I manually enter a recipe?',
    answer: 'Choose "Manual Entry" on the New Recipe page. You\'ll see tabs for Overview (title, tags, ratings), Ingredients (our smart parser handles "1 cup flour" automatically), Directions, Notes, and Photos. Fill in what you know - only title and ingredients are required.',
    category: 'Adding Recipes',
  },
  {
    question: 'Why doesn\'t my recipe show prep time or cook time?',
    answer: 'Prep time and cook time are optional fields. If you imported from a photo or URL that didn\'t include times, or you skipped them during manual entry, they\'ll be blank. You can always edit the recipe to add them later.',
    category: 'Adding Recipes',
  },
  {
    question: 'Can I add multiple photos to a recipe?',
    answer: 'Currently, each recipe supports one primary photo. This keeps the interface clean and focused. You can always replace the photo by editing the recipe and uploading a new image.',
    category: 'Adding Recipes',
  },

  // Recipe Organization
  {
    question: 'How do I tag and filter recipes?',
    answer: 'When creating or editing a recipe, add freeform tags like "quick", "vegetarian", or "comfort food". Use the filter buttons on the Recipes page to show only tagged recipes. Tags are flexible - create whatever organizational system works for your household.',
    category: 'Recipe Organization',
  },
  {
    question: 'Why doesn\'t my recipe appear when I filter by "dinner"?',
    answer: (
      <>
        Two possible reasons: (1) The recipe doesn&rsquo;t have &ldquo;dinner&rdquo; as a tag, or (2) The meal type isn&rsquo;t set to &ldquo;dinner&rdquo;. Tags and meal types are separate filters. Check your recipe and add the appropriate tag or set the meal type to make it show up.
      </>
    ),
    category: 'Recipe Organization',
  },
  {
    question: 'What\'s the difference between tags and meal types?',
    answer: 'Meal types (breakfast, lunch, dinner, snack) are categorical filters - a recipe fits one bucket. Tags are freeform labels you create - a recipe can have multiple tags like "quick", "chicken", "spicy". Think of meal type as when you eat it, tags as how you describe it.',
    category: 'Recipe Organization',
  },
  {
    question: 'How do recipe ratings work?',
    answer: 'Rate recipes 1-5 stars based on your household\'s experience. Ratings help you remember favorites and filter recipes - you can show only 4+ star recipes when you want guaranteed winners. Ratings are optional and only visible to your household.',
    category: 'Recipe Organization',
  },

  // Grocery Lists
  {
    question: 'How do I create a new grocery list?',
    answer: 'Go to Grocery Lists and tap the "+" button. Give it a descriptive name like "Weekly Shopping", "Costco Run", or "Birthday Party". You can create multiple lists for different stores, occasions, or shopping trips - whatever matches your workflow.',
    category: 'Grocery Lists',
  },
  {
    question: 'How do I add ingredients from a recipe to my grocery list?',
    answer: 'Open any recipe and tap "Push to Grocery List". Select your target list, check the ingredients you need, and tap Push. Ingredients appear with quantities and units, linked back to the source recipe. It\'s the fastest way to build a shopping list from meal plans.',
    category: 'Grocery Lists',
  },
  {
    question: 'Can I add ingredients to multiple lists at once?',
    answer: 'Yes! When pushing ingredients, tap "+ Add second list" to enable dual-list mode. You\'ll see two columns of checkboxes - assign each ingredient to List A, List B, both, or neither. Perfect for splitting items between different stores like Costco and your local grocery.',
    category: 'Grocery Lists',
  },
  {
    question: 'What does "protected list" mean?',
    answer: 'Protected lists (like your "Costco Master" catalog) are shielded from bulk operations. You can\'t accidentally "Check All" or "Delete Checked" on a protected list - only individual item management is allowed. Use this for master lists you want to preserve as reference catalogs.',
    category: 'Grocery Lists',
  },
  {
    question: 'How do grocery categories work?',
    answer: 'MealBrain auto-categorizes items using AI (Produce, Dairy, Meat, etc.) based on a learning cache of 150+ common items. The system gets smarter over time - frequently categorized items cost almost nothing after the first week. Categories group items by store layout for efficient shopping.',
    category: 'Grocery Lists',
  },
  {
    question: 'How do I mark items as out of stock?',
    answer: 'Tap the frown icon next to any grocery item to mark it out of stock. This helps you remember to check again later or find it at a different store. Out of stock items stay on your list until you\'re ready to remove them.',
    category: 'Grocery Lists',
  },

  // Tips & Tricks
  {
    question: 'How do I copy items between grocery lists?',
    answer: 'On any grocery list, check the items you want to copy, tap the three-dot menu, and choose "Copy to..." Select the destination list and the items are duplicated. The original items stay checked, the copies are unchecked and ready to shop.',
    category: 'Tips & Tricks',
  },
  {
    question: 'What are the AI preferences?',
    answer: 'Go to Settings → AI Preferences to control how the Sous Chef behaves. Choose between different models (Haiku is fast, Sonnet is thoughtful), adjust response tone, and customize suggestion behavior. These settings let you tune the AI to match your cooking style.',
    category: 'Tips & Tricks',
  },
  {
    question: 'How do I change my theme color?',
    answer: 'Go to Settings → UI Preferences and pick your favorite color. The theme color personalizes buttons, highlights, and interactive elements throughout the app. Your choice applies across all devices where you\'re signed in.',
    category: 'Tips & Tricks',
  },
  {
    question: 'Can I export my recipes and data?',
    answer: 'Yes! Go to Settings → Import/Export to download your recipes, grocery lists, and preferences as JSON files. This gives you a backup and lets you move data between households or keep an archive. You can also import data from these files.',
    category: 'Tips & Tricks',
  },
];

export const categories = [
  'Getting Started',
  'AI Sous Chef',
  'Adding Recipes',
  'Recipe Organization',
  'Grocery Lists',
  'Tips & Tricks',
];
