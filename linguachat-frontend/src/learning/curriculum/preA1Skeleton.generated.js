/*
 * GENERATED FILE — do not edit by hand.
 *
 * The shape of the curriculum without its words: what each episode teaches, which
 * intents its steps evaluate, which language items they produce, what unlocks
 * what. Written by `scripts/build-curriculum-skeleton.mjs` from the episode
 * definitions, which remain the single source of truth, and re-derived and
 * compared by `check-curriculum-loading` so it can never drift from them.
 *
 * It exists so that knowing ABOUT the curriculum does not mean downloading it:
 * the planner, the readiness rules and Home read this, while the prose lives
 * with the screens that render it.
 *
 * To regenerate:  npm run build:skeleton
 */
export const EPISODE_SKELETON = [
  {
    "id": "first_greeting",
    "level": "Pre-A1",
    "arc": "greetings",
    "titleKey": "ep1Title",
    "goalKey": "ep1Goal",
    "canDoId": "introduce_self",
    "canDoNameKey": "ep1CanDoName",
    "durationKey": "ep1Duration",
    "estimatedMinutes": 6,
    "xp": 40,
    "gardenItems": [
      "hi",
      "hello",
      "im",
      "whats_your_name"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "hi",
          "im"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "whats_your_name"
      },
      {
        "type": "word_order",
        "itemId": "hi",
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "fill_blank",
        "itemId": "im"
      },
      {
        "type": "free_reply",
        "evalKind": "introduction",
        "itemIds": [
          "hi",
          "im"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "introduction",
        "itemIds": [
          "im"
        ],
        "variation": true,
        "placeholders": [
          "partner",
          "name"
        ]
      },
      {
        "type": "recall",
        "evalKind": "introduction",
        "itemIds": [
          "im"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "ask_name",
    "level": "Pre-A1",
    "arc": "greetings",
    "titleKey": "ep2Title",
    "goalKey": "ep2Goal",
    "canDoId": "ask_name",
    "canDoNameKey": "ep2CanDoName",
    "durationKey": "ep2Duration",
    "estimatedMinutes": 7,
    "xp": 45,
    "prerequisites": [
      "first_greeting"
    ],
    "gardenItems": [
      "whats_your_name",
      "my_name_is",
      "name"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "introduction",
        "itemIds": [
          "im"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "whats_your_name",
          "im"
        ],
        "placeholders": [
          "partner"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "whats_your_name"
      },
      {
        "type": "word_order",
        "itemId": "whats_your_name"
      },
      {
        "type": "fill_blank",
        "itemId": "my_name_is"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_name",
        "itemIds": [
          "whats_your_name"
        ],
        "placeholders": [
          "partner"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "my_name_is",
        "variation": true
      },
      {
        "type": "recall",
        "evalKind": "ask_name",
        "itemIds": [
          "whats_your_name"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "nice_to_meet",
    "level": "Pre-A1",
    "arc": "greetings",
    "titleKey": "ep3Title",
    "goalKey": "ep3Goal",
    "canDoId": "full_greeting",
    "canDoNameKey": "ep3CanDoName",
    "durationKey": "ep3Duration",
    "estimatedMinutes": 8,
    "xp": 55,
    "prerequisites": [
      "ask_name"
    ],
    "gardenItems": [
      "nice_to_meet",
      "my_name_is",
      "name"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "introduction",
        "itemIds": [
          "im"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "comprehension",
        "itemId": "whats_your_name"
      },
      {
        "type": "choice",
        "itemId": "my_name_is",
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "word_order",
        "itemId": "nice_to_meet"
      },
      {
        "type": "free_reply",
        "evalKind": "introduction",
        "itemIds": [
          "hi",
          "im"
        ],
        "placeholders": [
          "partner",
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "nice_to_meet",
        "itemIds": [
          "nice_to_meet"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "nice_to_meet",
        "variation": true
      },
      {
        "type": "recall",
        "evalKind": "introduction",
        "itemIds": [
          "im",
          "hi"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "how_are_you",
    "level": "Pre-A1",
    "arc": "connect",
    "titleKey": "ep4Title",
    "goalKey": "ep4Goal",
    "canDoId": "ask_wellbeing",
    "canDoNameKey": "ep4CanDoName",
    "durationKey": "ep4Duration",
    "estimatedMinutes": 7,
    "xp": 50,
    "prerequisites": [
      "nice_to_meet"
    ],
    "gardenItems": [
      "how_are_you",
      "im_good",
      "and_you",
      "good",
      "fine",
      "tired",
      "im_feeling_pattern"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "introduction",
        "itemIds": [
          "im"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "how_are_you",
          "im_good"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "how_are_you"
      },
      {
        "type": "word_order",
        "itemId": "how_are_you"
      },
      {
        "type": "choice",
        "itemId": "im_feeling_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "answer_wellbeing",
        "itemIds": [
          "im_good",
          "good"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_wellbeing",
        "itemIds": [
          "how_are_you"
        ],
        "placeholders": [
          "partner"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "reciprocal_question",
        "itemIds": [
          "and_you"
        ],
        "variation": true
      },
      {
        "type": "recall",
        "evalKind": "ask_wellbeing",
        "itemIds": [
          "how_are_you"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "where_from",
    "level": "Pre-A1",
    "arc": "connect",
    "titleKey": "ep5Title",
    "goalKey": "ep5Goal",
    "canDoId": "ask_origin",
    "canDoNameKey": "ep5CanDoName",
    "durationKey": "ep5Duration",
    "estimatedMinutes": 8,
    "xp": 55,
    "prerequisites": [
      "how_are_you"
    ],
    "gardenItems": [
      "where_from",
      "im_from",
      "from",
      "what_about_you",
      "im_from_pattern"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "introduction",
        "itemIds": [
          "im"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "where_from",
          "im_from"
        ],
        "placeholders": [
          "partnerPlace"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "where_from"
      },
      {
        "type": "word_order",
        "itemId": "where_from"
      },
      {
        "type": "fill_blank",
        "itemId": "im_from_pattern",
        "captureFact": "place"
      },
      {
        "type": "free_reply",
        "evalKind": "answer_origin",
        "itemIds": [
          "im_from",
          "from"
        ],
        "placeholders": [
          "partnerPlace",
          "place"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_origin",
        "itemIds": [
          "where_from"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "reciprocal_question",
        "itemIds": [
          "what_about_you"
        ],
        "variation": true,
        "placeholders": [
          "partnerPlace"
        ]
      },
      {
        "type": "recall",
        "evalKind": "answer_origin",
        "itemIds": [
          "im_from"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "first_conversation",
    "level": "Pre-A1",
    "arc": "connect",
    "titleKey": "ep6Title",
    "goalKey": "ep6Goal",
    "canDoId": "full_conversation",
    "canDoNameKey": "ep6CanDoName",
    "durationKey": "ep6Duration",
    "estimatedMinutes": 10,
    "xp": 70,
    "prerequisites": [
      "where_from"
    ],
    "gardenItems": [
      "how_are_you",
      "where_from",
      "nice_to_meet"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "introduction",
        "itemIds": [
          "hi",
          "im"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_name",
        "itemIds": [
          "whats_your_name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "nice_to_meet",
        "itemIds": [
          "nice_to_meet"
        ],
        "placeholders": [
          "partner"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_wellbeing",
        "itemIds": [
          "how_are_you"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "answer_wellbeing",
        "itemIds": [
          "im_good"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_origin",
        "itemIds": [
          "where_from"
        ],
        "placeholders": [
          "partnerPlace"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "answer_origin",
        "itemIds": [
          "im_from"
        ],
        "placeholders": [
          "place"
        ]
      },
      {
        "type": "recall",
        "evalKind": "full_intro_conversation",
        "itemIds": [
          "im",
          "how_are_you"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "what_you_like",
    "level": "Pre-A1",
    "arc": "choose",
    "titleKey": "ep7Title",
    "goalKey": "ep7Goal",
    "canDoId": "express_preferences",
    "canDoNameKey": "ep7CanDoName",
    "durationKey": "ep7Duration",
    "estimatedMinutes": 8,
    "xp": 55,
    "prerequisites": [
      "first_conversation"
    ],
    "gardenItems": [
      "like",
      "i_like",
      "i_dont_like",
      "what_do_you_like",
      "do_you_like",
      "i_like_pattern"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "ask_wellbeing",
        "itemIds": [
          "how_are_you"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "i_like",
          "what_do_you_like"
        ],
        "placeholders": [
          "noun"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "i_like",
        "placeholders": [
          "noun"
        ]
      },
      {
        "type": "word_order",
        "itemId": "i_like",
        "placeholders": [
          "noun"
        ]
      },
      {
        "type": "fill_blank",
        "itemId": "i_like_pattern",
        "captureFact": "likes"
      },
      {
        "type": "model",
        "meaningItems": [
          "i_dont_like"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "express_dislike",
        "itemIds": [
          "i_dont_like"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "yes_no_preference",
        "itemIds": [
          "do_you_like"
        ],
        "placeholders": [
          "noun",
          "object"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_preference",
        "itemIds": [
          "what_do_you_like"
        ]
      },
      {
        "type": "recall",
        "evalKind": "express_like",
        "itemIds": [
          "i_like",
          "like"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "what_you_want",
    "level": "Pre-A1",
    "arc": "choose",
    "titleKey": "ep8Title",
    "goalKey": "ep8Goal",
    "canDoId": "express_needs",
    "canDoNameKey": "ep8CanDoName",
    "durationKey": "ep8Duration",
    "estimatedMinutes": 8,
    "xp": 55,
    "prerequisites": [
      "what_you_like"
    ],
    "gardenItems": [
      "want",
      "need",
      "help",
      "please",
      "i_want",
      "i_need",
      "do_you_want",
      "yes_please",
      "no_thank_you",
      "i_want_pattern"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "express_like",
        "itemIds": [
          "i_like"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "i_want",
          "i_need"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "i_need"
      },
      {
        "type": "word_order",
        "itemId": "i_want"
      },
      {
        "type": "choice",
        "itemId": "i_want_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "express_need",
        "itemIds": [
          "i_need",
          "need"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_want",
        "itemIds": [
          "do_you_want"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "accept_offer",
        "itemIds": [
          "yes_please",
          "please"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "decline_offer",
        "itemIds": [
          "no_thank_you"
        ],
        "variation": true
      },
      {
        "type": "recall",
        "evalKind": "express_want",
        "itemIds": [
          "i_want",
          "want"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "make_a_plan",
    "level": "Pre-A1",
    "arc": "choose",
    "titleKey": "ep9Title",
    "goalKey": "ep9Goal",
    "canDoId": "make_plan",
    "canDoNameKey": "ep9CanDoName",
    "durationKey": "ep9Duration",
    "estimatedMinutes": 10,
    "xp": 75,
    "prerequisites": [
      "what_you_want"
    ],
    "gardenItems": [
      "i_like",
      "do_you_want",
      "yes_please",
      "no_thank_you"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "answer_wellbeing",
        "itemIds": [
          "im_good"
        ],
        "format": "roleplay",
        "placeholders": [
          "partner"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "express_like",
        "itemIds": [
          "i_like"
        ],
        "format": "roleplay",
        "placeholders": [
          "noun"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_preference",
        "itemIds": [
          "what_do_you_like"
        ],
        "format": "roleplay",
        "placeholders": [
          "object"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "accept_offer",
        "itemIds": [
          "yes_please",
          "no_thank_you"
        ],
        "branchOn": "accept_decline",
        "format": "roleplay",
        "placeholders": [
          "noun",
          "activity"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "express_want",
        "itemIds": [
          "i_want"
        ],
        "format": "roleplay",
        "placeholders": [
          "branchLine"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_want",
        "itemIds": [
          "do_you_want"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "simple_plan_conversation",
        "itemIds": [
          "i_like",
          "do_you_want"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "a_coffee_please",
    "level": "Pre-A1",
    "arc": "cafe",
    "titleKey": "ep10Title",
    "goalKey": "ep10Goal",
    "canDoId": "polite_request",
    "canDoNameKey": "ep10CanDoName",
    "durationKey": "ep10Duration",
    "estimatedMinutes": 8,
    "xp": 55,
    "prerequisites": [
      "make_a_plan"
    ],
    "gardenItems": [
      "water",
      "coffee",
      "tea",
      "juice",
      "please",
      "thank_you",
      "can_i_have",
      "here_you_are",
      "can_i_have_pattern"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "express_want",
        "itemIds": [
          "i_want"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "can_i_have",
          "please"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "can_i_have"
      },
      {
        "type": "word_order",
        "itemId": "can_i_have"
      },
      {
        "type": "choice",
        "itemId": "can_i_have"
      },
      {
        "type": "fill_blank",
        "itemId": "can_i_have_pattern",
        "contextIntent": "polite_request"
      },
      {
        "type": "free_reply",
        "evalKind": "polite_request",
        "itemIds": [
          "can_i_have",
          "please"
        ],
        "format": "roleplay",
        "placeholders": [
          "item"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "thank_service",
        "itemIds": [
          "thank_you"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "polite_request",
        "itemIds": [
          "can_i_have"
        ],
        "variation": true,
        "placeholders": [
          "otherItem"
        ]
      },
      {
        "type": "recall",
        "evalKind": "polite_request",
        "itemIds": [
          "can_i_have",
          "please"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "anything_else",
    "level": "Pre-A1",
    "arc": "cafe",
    "titleKey": "ep11Title",
    "goalKey": "ep11Goal",
    "canDoId": "respond_anything_else",
    "canDoNameKey": "ep11CanDoName",
    "durationKey": "ep11Duration",
    "estimatedMinutes": 8,
    "xp": 55,
    "prerequisites": [
      "a_coffee_please"
    ],
    "gardenItems": [
      "anything_else",
      "yes_please",
      "no_thank_you",
      "thats_all",
      "thank_you"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "polite_request",
        "itemIds": [
          "can_i_have"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "anything_else",
          "no_thank_you"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "anything_else"
      },
      {
        "type": "choice",
        "itemId": "no_thank_you"
      },
      {
        "type": "word_order",
        "itemId": "thats_all"
      },
      {
        "type": "free_reply",
        "evalKind": "respond_anything_else",
        "itemIds": [
          "no_thank_you",
          "yes_please"
        ],
        "branchOn": "accept_decline",
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "thank_service",
        "itemIds": [
          "thank_you"
        ],
        "format": "roleplay",
        "placeholders": [
          "branchLine"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "finish_order",
        "itemIds": [
          "thats_all"
        ],
        "variation": true
      },
      {
        "type": "recall",
        "evalKind": "respond_anything_else",
        "itemIds": [
          "no_thank_you"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "your_first_order",
    "level": "Pre-A1",
    "arc": "cafe",
    "titleKey": "ep12Title",
    "goalKey": "ep12Goal",
    "canDoId": "cafe_order",
    "canDoNameKey": "ep12CanDoName",
    "durationKey": "ep12Duration",
    "estimatedMinutes": 10,
    "xp": 75,
    "prerequisites": [
      "anything_else"
    ],
    "gardenItems": [
      "can_i_have",
      "please",
      "thank_you",
      "thats_all",
      "here_you_are"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "polite_request",
        "itemIds": [
          "can_i_have",
          "please"
        ],
        "format": "roleplay",
        "placeholders": [
          "item"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "respond_anything_else",
        "itemIds": [
          "no_thank_you",
          "yes_please"
        ],
        "branchOn": "accept_decline",
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "finish_order",
        "itemIds": [
          "thats_all"
        ],
        "format": "roleplay",
        "placeholders": [
          "branchLine"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "thank_service",
        "itemIds": [
          "thank_you"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "cafe_order_conversation",
        "itemIds": [
          "can_i_have",
          "please"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "lost_you",
    "level": "Pre-A1",
    "arc": "repair",
    "titleKey": "ep13Title",
    "goalKey": "ep13Goal",
    "canDoId": "ask_for_repair",
    "canDoNameKey": "ep13CanDoName",
    "durationKey": "ep13Duration",
    "estimatedMinutes": 7,
    "xp": 55,
    "prerequisites": [
      "your_first_order"
    ],
    "gardenItems": [
      "i_dont_understand"
    ],
    "skillPrerequisites": [
      "full_conversation"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "answer_origin",
        "itemIds": [
          "im_from"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "i_dont_understand"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "i_dont_understand"
      },
      {
        "type": "word_order",
        "itemId": "i_dont_understand"
      },
      {
        "type": "fill_blank",
        "itemId": "i_dont_understand"
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "i_dont_understand"
        ],
        "format": "roleplay",
        "repairKind": "signal_nonunderstanding",
        "placeholders": [
          "noun"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "yes_no_preference",
        "itemIds": [
          "do_you_like"
        ],
        "format": "roleplay",
        "placeholders": [
          "noun"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "i_dont_understand"
        ],
        "variation": true,
        "repairKind": "signal_nonunderstanding"
      },
      {
        "type": "recall",
        "evalKind": "repair_request",
        "itemIds": [
          "i_dont_understand"
        ],
        "repairKind": "signal_nonunderstanding"
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "say_again",
    "level": "Pre-A1",
    "arc": "repair",
    "titleKey": "ep14Title",
    "goalKey": "ep14Goal",
    "canDoId": "ask_for_repair",
    "canDoNameKey": "ep14CanDoName",
    "durationKey": "ep14Duration",
    "estimatedMinutes": 8,
    "xp": 55,
    "prerequisites": [
      "lost_you"
    ],
    "gardenItems": [
      "can_you_repeat",
      "speak_slowly",
      "repair_pattern"
    ],
    "reinforces": true,
    "skillPrerequisites": [
      "ask_for_repair"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "repair_request",
        "itemIds": [
          "i_dont_understand"
        ],
        "review": true,
        "repairKind": "signal_nonunderstanding"
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "can_you_repeat"
        ]
      },
      {
        "type": "choice",
        "itemId": "can_you_repeat"
      },
      {
        "type": "fill_blank",
        "itemId": "repair_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "format": "roleplay",
        "repairKind": "repeat"
      },
      {
        "type": "free_reply",
        "evalKind": "answer_origin",
        "itemIds": [
          "im_from"
        ],
        "format": "roleplay",
        "placeholders": [
          "place"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "reciprocal_question",
        "itemIds": [
          "what_about_you"
        ],
        "format": "roleplay",
        "placeholders": [
          "partnerPlace"
        ]
      },
      {
        "type": "model",
        "meaningItems": [
          "speak_slowly"
        ]
      },
      {
        "type": "word_order",
        "itemId": "speak_slowly"
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "speak_slowly"
        ],
        "format": "roleplay",
        "repairKind": "slow_down"
      },
      {
        "type": "recall",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "repairKind": "repeat"
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "we_can_continue",
    "level": "Pre-A1",
    "arc": "repair",
    "titleKey": "ep15Title",
    "goalKey": "ep15Goal",
    "canDoId": "close_an_encounter",
    "canDoNameKey": "ep15CanDoName",
    "durationKey": "ep15Duration",
    "estimatedMinutes": 10,
    "xp": 75,
    "prerequisites": [
      "say_again"
    ],
    "gardenItems": [
      "bye",
      "see_you"
    ],
    "skillPrerequisites": [
      "ask_for_repair",
      "full_conversation"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "see_you"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "introduction",
        "itemIds": [
          "hi",
          "im"
        ],
        "format": "roleplay",
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "answer_wellbeing",
        "itemIds": [
          "im_good"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "reciprocal_question",
        "itemIds": [
          "and_you"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "decline_offer",
        "itemIds": [
          "no_thank_you"
        ],
        "format": "roleplay"
      },
      {
        "type": "mini_story",
        "storyObjective": "repair_request",
        "turns": [
          {
            "kind": "scene"
          },
          {
            "kind": "choose"
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "yes_no_preference",
            "itemIds": [
              "do_you_like"
            ]
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "close_encounter",
            "itemIds": [
              "bye"
            ]
          },
          {
            "kind": "close"
          }
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "close_encounter",
        "itemIds": [
          "see_you"
        ],
        "variation": true
      },
      {
        "type": "recall",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "repairKind": "repeat"
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "what_is_this",
    "level": "Pre-A1",
    "arc": "things",
    "titleKey": "ep16Title",
    "goalKey": "ep16Goal",
    "canDoId": "identify_things",
    "canDoNameKey": "ep16CanDoName",
    "durationKey": "ep16Duration",
    "estimatedMinutes": 7,
    "xp": 55,
    "prerequisites": [
      "we_can_continue"
    ],
    "gardenItems": [
      "whats_this",
      "its_a_pattern",
      "book",
      "phone",
      "bag"
    ],
    "skillPrerequisites": [
      "ask_name"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "whats_this"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "whats_this"
      },
      {
        "type": "word_order",
        "itemId": "whats_this"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_what_thing",
        "itemIds": [
          "whats_this"
        ],
        "format": "roleplay"
      },
      {
        "type": "model",
        "meaningItems": [
          "its_a_pattern",
          "book"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "identify_thing",
        "itemIds": [
          "its_a_pattern",
          "book"
        ],
        "format": "roleplay",
        "thingId": "book"
      },
      {
        "type": "free_reply",
        "evalKind": "identify_thing",
        "itemIds": [
          "its_a_pattern",
          "phone"
        ],
        "format": "roleplay",
        "thingId": "phone"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_what_thing",
        "itemIds": [
          "whats_this"
        ],
        "variation": true
      },
      {
        "type": "free_reply",
        "evalKind": "identify_thing",
        "itemIds": [
          "its_a_pattern",
          "bag"
        ],
        "format": "roleplay",
        "thingId": "bag"
      },
      {
        "type": "recall",
        "evalKind": "ask_what_thing",
        "itemIds": [
          "whats_this"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "how_many",
    "level": "Pre-A1",
    "arc": "things",
    "titleKey": "ep17Title",
    "goalKey": "ep17Goal",
    "canDoId": "use_small_numbers",
    "canDoNameKey": "ep17CanDoName",
    "durationKey": "ep17Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "what_is_this"
    ],
    "gardenItems": [
      "numbers_1_10",
      "how_many",
      "quantity_pattern"
    ],
    "skillPrerequisites": [
      "identify_things",
      "polite_request"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "identify_thing",
        "itemIds": [
          "its_a_pattern"
        ],
        "review": true,
        "thingId": "book"
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "numbers_1_10"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "how_many"
      },
      {
        "type": "choice",
        "itemId": "numbers_1_10"
      },
      {
        "type": "free_reply",
        "evalKind": "use_quantity",
        "itemIds": [
          "numbers_1_10"
        ],
        "format": "roleplay",
        "thingId": "book",
        "quantityForm": "bare",
        "count": 2
      },
      {
        "type": "free_reply",
        "evalKind": "use_quantity",
        "itemIds": [
          "numbers_1_10",
          "quantity_pattern"
        ],
        "format": "roleplay",
        "thingId": "book",
        "quantityForm": "with_object",
        "count": 3
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "format": "roleplay",
        "repairKind": "repeat"
      },
      {
        "type": "free_reply",
        "evalKind": "use_quantity",
        "itemIds": [
          "numbers_1_10",
          "can_i_have_pattern"
        ],
        "format": "roleplay",
        "thingId": "sandwich",
        "quantityForm": "polite_request",
        "count": 2
      },
      {
        "type": "free_reply",
        "evalKind": "respond_anything_else",
        "itemIds": [
          "no_thank_you"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "close_encounter",
        "itemIds": [
          "bye"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "use_quantity",
        "itemIds": [
          "numbers_1_10",
          "quantity_pattern"
        ],
        "thingId": "book",
        "quantityForm": "with_object",
        "count": 2
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "what_you_do",
    "level": "A1",
    "arc": "work_and_study",
    "titleKey": "ep18Title",
    "goalKey": "ep18Goal",
    "canDoId": "talk_about_work_or_study",
    "canDoNameKey": "ep18CanDoName",
    "durationKey": "ep18Duration",
    "estimatedMinutes": 8,
    "xp": 70,
    "gardenItems": [
      "work",
      "study",
      "i_do_pattern",
      "at_home"
    ],
    "skillPrerequisites": [
      "introduce_self",
      "ask_origin"
    ],
    "role": "primary",
    "reuseSkills": [
      "introduce_self"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "recall",
        "evalKind": "introduction",
        "itemIds": [
          "im"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "work",
          "study"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "what_do_you_do"
      },
      {
        "type": "word_order",
        "itemId": "i_do_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "i_do_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "state_life_fact",
        "itemIds": [
          "work",
          "study",
          "i_do_pattern",
          "at_home"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "choice",
        "itemId": "at_the_office"
      },
      {
        "type": "free_reply",
        "evalKind": "state_life_fact",
        "itemIds": [
          "im",
          "work",
          "study",
          "i_do_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "recall",
        "evalKind": "state_life_fact",
        "itemIds": [
          "i_do_pattern",
          "work",
          "study"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "and_you",
    "level": "A1",
    "arc": "work_and_study",
    "titleKey": "ep19Title",
    "goalKey": "ep19Goal",
    "canDoId": "ask_about_work_or_study",
    "canDoNameKey": "ep19CanDoName",
    "durationKey": "ep19Duration",
    "estimatedMinutes": 8,
    "xp": 70,
    "prerequisites": [
      "what_you_do"
    ],
    "gardenItems": [
      "what_do_you_do",
      "do_you_pattern",
      "at_the_office",
      "at_university"
    ],
    "skillPrerequisites": [
      "talk_about_work_or_study",
      "ask_name"
    ],
    "role": "primary",
    "reuseSkills": [
      "ask_name",
      "talk_about_work_or_study",
      "ask_for_repair"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_life_fact",
        "itemIds": [
          "i_do_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "do_you_pattern",
          "what_do_you_do"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "at_university"
      },
      {
        "type": "word_order",
        "itemId": "do_you_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "do_you_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_life_fact",
        "itemIds": [
          "do_you_pattern",
          "what_do_you_do"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_name",
        "itemIds": [
          "whats_your_name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "repairKind": "repeat"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_life_fact",
        "itemIds": [
          "do_you_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "ask_life_fact",
        "itemIds": [
          "do_you_pattern",
          "what_do_you_do"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "meeting_someone_new",
    "level": "A1",
    "arc": "work_and_study",
    "titleKey": "ep20Title",
    "goalKey": "ep20Goal",
    "canDoId": "talk_about_work_or_study",
    "canDoNameKey": "ep20CanDoName",
    "durationKey": "ep20Duration",
    "estimatedMinutes": 10,
    "xp": 80,
    "prerequisites": [
      "and_you"
    ],
    "reinforces": true,
    "skillPrerequisites": [
      "introduce_self",
      "ask_name",
      "ask_origin",
      "close_an_encounter"
    ],
    "role": "reinforcement",
    "reuseSkills": [
      "introduce_self",
      "ask_name",
      "ask_origin",
      "close_an_encounter"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "introduction",
        "itemIds": [
          "hi",
          "im"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_name",
        "itemIds": [
          "whats_your_name"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_origin",
        "itemIds": [
          "where_from"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "state_life_fact",
        "itemIds": [
          "i_do_pattern",
          "work",
          "study"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_life_fact",
        "itemIds": [
          "do_you_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "close_encounter",
        "itemIds": [
          "bye"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "state_life_fact",
        "itemIds": [
          "i_do_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "my_day",
    "level": "A1",
    "arc": "daily_rhythm",
    "titleKey": "ep21Title",
    "goalKey": "ep21Goal",
    "canDoId": "talk_about_daily_routine",
    "canDoNameKey": "ep21CanDoName",
    "durationKey": "ep21Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "meeting_someone_new"
    ],
    "gardenItems": [
      "get_up",
      "have_breakfast",
      "usually",
      "sometimes",
      "frequency_pattern"
    ],
    "skillPrerequisites": [
      "talk_about_work_or_study"
    ],
    "role": "primary",
    "reuseSkills": [
      "talk_about_work_or_study",
      "express_like"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_life_fact",
        "itemIds": [
          "i_do_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "get_up",
          "have_breakfast"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "sometimes"
      },
      {
        "type": "word_order",
        "itemId": "frequency_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "frequency_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "state_routine",
        "itemIds": [
          "get_up",
          "usually",
          "frequency_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "express_like",
        "itemIds": [
          "i_like"
        ],
        "contextIntent": "express_like",
        "placeholders": [
          "noun"
        ]
      },
      {
        "type": "choice",
        "itemId": "sometimes"
      },
      {
        "type": "free_reply",
        "evalKind": "state_routine",
        "itemIds": [
          "i_do_pattern",
          "get_up",
          "usually"
        ]
      },
      {
        "type": "recall",
        "evalKind": "state_routine",
        "itemIds": [
          "frequency_pattern",
          "get_up",
          "have_breakfast"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "at_seven",
    "level": "A1",
    "arc": "daily_rhythm",
    "titleKey": "ep22Title",
    "goalKey": "ep22Goal",
    "canDoId": "say_when_something_happens",
    "canDoNameKey": "ep22CanDoName",
    "durationKey": "ep22Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "my_day"
    ],
    "gardenItems": [
      "part_of_day_pattern",
      "time_at_pattern"
    ],
    "skillPrerequisites": [
      "talk_about_daily_routine",
      "use_small_numbers"
    ],
    "role": "primary",
    "reuseSkills": [
      "use_quantity",
      "talk_about_daily_routine",
      "ask_for_repair"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_routine",
        "itemIds": [
          "frequency_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "part_of_day_pattern",
          "time_at_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "time_at_pattern"
      },
      {
        "type": "word_order",
        "itemId": "part_of_day_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "time_at_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "use_quantity",
        "itemIds": [
          "numbers_1_10"
        ],
        "quantityForm": "bare",
        "count": 3
      },
      {
        "type": "free_reply",
        "evalKind": "state_routine",
        "itemIds": [
          "part_of_day_pattern",
          "usually"
        ],
        "timeForm": "part_of_day"
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "repairKind": "repeat"
      },
      {
        "type": "free_reply",
        "evalKind": "state_routine",
        "itemIds": [
          "time_at_pattern",
          "get_up"
        ],
        "timeForm": "clock"
      },
      {
        "type": "recall",
        "evalKind": "state_routine",
        "itemIds": [
          "time_at_pattern"
        ],
        "timeForm": "clock"
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "what_does_it_mean",
    "level": "A1",
    "arc": "daily_rhythm",
    "titleKey": "ep23Title",
    "goalKey": "ep23Goal",
    "canDoId": "ask_what_something_means",
    "canDoNameKey": "ep23CanDoName",
    "durationKey": "ep23Duration",
    "estimatedMinutes": 10,
    "xp": 85,
    "prerequisites": [
      "at_seven"
    ],
    "gardenItems": [
      "what_does_mean_pattern"
    ],
    "skillPrerequisites": [
      "ask_for_repair",
      "talk_about_daily_routine",
      "say_when_something_happens"
    ],
    "role": "primary",
    "reuseSkills": [
      "ask_for_repair",
      "ask_about_work_or_study",
      "talk_about_daily_routine"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_routine",
        "itemIds": [
          "time_at_pattern"
        ],
        "review": true,
        "timeForm": "clock"
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "what_does_mean_pattern",
          "early"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "late"
      },
      {
        "type": "mini_story",
        "storyObjective": "state_routine",
        "turns": [
          {
            "kind": "scene"
          },
          {
            "kind": "choose"
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "state_routine",
            "itemIds": [
              "get_up",
              "time_at_pattern"
            ]
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "state_routine",
            "itemIds": [
              "part_of_day_pattern",
              "usually"
            ]
          },
          {
            "kind": "close"
          }
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "what_does_mean_pattern"
        ],
        "repairKind": "ask_meaning"
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "repairKind": "repeat"
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "what_does_mean_pattern"
        ],
        "repairKind": "ask_meaning"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_life_fact",
        "itemIds": [
          "do_you_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "state_routine",
        "itemIds": [
          "time_at_pattern",
          "frequency_pattern"
        ],
        "timeForm": "clock"
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "this_is",
    "level": "A1",
    "arc": "people_around_you",
    "titleKey": "ep24Title",
    "goalKey": "ep24Goal",
    "canDoId": "introduce_someone_else",
    "canDoNameKey": "ep24CanDoName",
    "durationKey": "ep24Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "meeting_someone_new"
    ],
    "gardenItems": [
      "this_is_pattern",
      "possessive_pattern",
      "friend",
      "colleague"
    ],
    "skillPrerequisites": [
      "introduce_self",
      "full_greeting"
    ],
    "role": "primary",
    "reuseSkills": [
      "introduction",
      "nice_to_meet"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "introduction",
        "itemIds": [
          "im"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "this_is_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "this_is_pattern"
      },
      {
        "type": "word_order",
        "itemId": "this_is_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "possessive_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "introduce_person",
        "itemIds": [
          "this_is_pattern",
          "friend"
        ],
        "placeholders": [
          "partner"
        ]
      },
      {
        "type": "choice",
        "itemId": "nice_to_meet",
        "placeholders": [
          "partner"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "nice_to_meet",
        "itemIds": [
          "nice_to_meet"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "introduce_person",
        "itemIds": [
          "im",
          "this_is_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "introduce_person",
        "itemIds": [
          "this_is_pattern",
          "possessive_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "shes_a_student",
    "level": "A1",
    "arc": "people_around_you",
    "titleKey": "ep25Title",
    "goalKey": "ep25Goal",
    "canDoId": "introduce_someone_else",
    "canDoNameKey": "ep25CanDoName",
    "durationKey": "ep25Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "this_is"
    ],
    "gardenItems": [
      "he_she_is_pattern",
      "classmate"
    ],
    "reinforces": true,
    "skillPrerequisites": [
      "introduce_someone_else",
      "talk_about_work_or_study"
    ],
    "role": "reinforcement",
    "reuseSkills": [
      "state_life_fact",
      "ask_name"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "introduce_person",
        "itemIds": [
          "this_is_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "he_she_is_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "works_third"
      },
      {
        "type": "choice",
        "itemId": "he_she_is_pattern"
      },
      {
        "type": "word_order",
        "itemId": "he_she_is_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "he_she_is_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "state_person_fact",
        "itemIds": [
          "he_she_is_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_life_fact",
        "itemIds": [
          "i_do_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_name",
        "itemIds": [
          "whats_your_name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_person_fact",
        "itemIds": [
          "he_she_is_pattern",
          "classmate"
        ]
      },
      {
        "type": "recall",
        "evalKind": "state_person_fact",
        "itemIds": [
          "he_she_is_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "three_of_us",
    "level": "A1",
    "arc": "people_around_you",
    "titleKey": "ep26Title",
    "goalKey": "ep26Goal",
    "canDoId": "introduce_someone_else",
    "canDoNameKey": "ep26CanDoName",
    "durationKey": "ep26Duration",
    "estimatedMinutes": 10,
    "xp": 85,
    "prerequisites": [
      "shes_a_student"
    ],
    "reinforces": true,
    "skillPrerequisites": [
      "introduce_someone_else",
      "full_greeting",
      "ask_wellbeing",
      "close_an_encounter"
    ],
    "role": "reinforcement",
    "reuseSkills": [
      "nice_to_meet",
      "ask_wellbeing",
      "close_encounter",
      "state_life_fact",
      "repair_request"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "nice_to_meet",
        "itemIds": [
          "nice_to_meet"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "introduce_person",
        "itemIds": [
          "this_is_pattern",
          "possessive_pattern"
        ],
        "format": "roleplay",
        "placeholders": [
          "partner"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_wellbeing",
        "itemIds": [
          "how_are_you"
        ],
        "format": "roleplay",
        "placeholders": [
          "partner"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "what_does_mean_pattern"
        ],
        "format": "roleplay",
        "repairKind": "ask_meaning"
      },
      {
        "type": "free_reply",
        "evalKind": "state_life_fact",
        "itemIds": [
          "i_do_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "state_person_fact",
        "itemIds": [
          "he_she_is_pattern"
        ],
        "format": "roleplay",
        "placeholders": [
          "partner"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "close_encounter",
        "itemIds": [
          "bye",
          "see_you"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "introduce_person",
        "itemIds": [
          "this_is_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "where_is_it",
    "level": "A1",
    "arc": "finding_your_way",
    "titleKey": "ep27Title",
    "goalKey": "ep27Goal",
    "canDoId": "ask_where_something_is",
    "canDoNameKey": "ep27CanDoName",
    "durationKey": "ep27Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "meeting_someone_new"
    ],
    "gardenItems": [
      "where_is_pattern",
      "toilet",
      "here",
      "there"
    ],
    "skillPrerequisites": [
      "identify_things",
      "polite_request"
    ],
    "role": "primary",
    "reuseSkills": [
      "identify_thing",
      "polite_request"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "identify_thing",
        "itemIds": [
          "its_a_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "where_is_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "upstairs"
      },
      {
        "type": "word_order",
        "itemId": "where_is_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "where_is_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_location",
        "itemIds": [
          "where_is_pattern",
          "toilet"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "polite_request",
        "itemIds": [
          "please",
          "can_i_have"
        ]
      },
      {
        "type": "choice",
        "itemId": "behind"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_location",
        "itemIds": [
          "where_is_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "ask_location",
        "itemIds": [
          "where_is_pattern",
          "toilet"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "its_over_there",
    "level": "A1",
    "arc": "finding_your_way",
    "titleKey": "ep28Title",
    "goalKey": "ep28Goal",
    "canDoId": "say_where_something_is",
    "canDoNameKey": "ep28CanDoName",
    "durationKey": "ep28Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "where_is_it"
    ],
    "gardenItems": [
      "its_location_pattern",
      "next_to",
      "near"
    ],
    "skillPrerequisites": [
      "ask_where_something_is",
      "identify_things"
    ],
    "role": "primary",
    "reuseSkills": [
      "identify_thing",
      "ask_location"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "ask_location",
        "itemIds": [
          "where_is_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "its_location_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "opposite"
      },
      {
        "type": "choice",
        "itemId": "next_to"
      },
      {
        "type": "word_order",
        "itemId": "its_location_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "near"
      },
      {
        "type": "free_reply",
        "evalKind": "state_location",
        "itemIds": [
          "its_location_pattern",
          "next_to"
        ]
      },
      {
        "type": "choice",
        "itemId": "downstairs"
      },
      {
        "type": "free_reply",
        "evalKind": "identify_thing",
        "itemIds": [
          "its_a_pattern"
        ],
        "thingId": "book"
      },
      {
        "type": "free_reply",
        "evalKind": "state_location",
        "itemIds": [
          "its_location_pattern",
          "near"
        ]
      },
      {
        "type": "recall",
        "evalKind": "state_location",
        "itemIds": [
          "its_location_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "how_do_i_get_there",
    "level": "A1",
    "arc": "finding_your_way",
    "titleKey": "ep29Title",
    "goalKey": "ep29Goal",
    "canDoId": "ask_about_getting_somewhere",
    "canDoNameKey": "ep29CanDoName",
    "durationKey": "ep29Duration",
    "estimatedMinutes": 10,
    "xp": 85,
    "prerequisites": [
      "its_over_there"
    ],
    "gardenItems": [
      "station"
    ],
    "skillPrerequisites": [
      "ask_where_something_is",
      "ask_for_repair",
      "polite_request",
      "close_an_encounter"
    ],
    "role": "primary",
    "reuseSkills": [
      "ask_location",
      "repair_request",
      "polite_request",
      "close_encounter"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "ask_location",
        "itemIds": [
          "where_is_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "comprehension",
        "itemId": "bus"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_transport",
        "itemIds": [
          "where_is_pattern",
          "station"
        ]
      },
      {
        "type": "mini_story",
        "storyObjective": "ask_transport",
        "turns": [
          {
            "kind": "scene"
          },
          {
            "kind": "choose"
          },
          {
            "kind": "reply",
            "evalKind": "ask_transport",
            "itemIds": [
              "where_is_pattern",
              "station"
            ]
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "repair_request",
            "itemIds": [
              "can_you_repeat"
            ],
            "repairKind": "repeat"
          },
          {
            "kind": "line"
          },
          {
            "kind": "close"
          }
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "close_encounter",
        "itemIds": [
          "thank_you",
          "bye"
        ]
      },
      {
        "type": "recall",
        "evalKind": "ask_transport",
        "itemIds": [
          "where_is_pattern",
          "station"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "more_than_ten",
    "level": "A1",
    "arc": "paying_and_choosing",
    "titleKey": "ep30Title",
    "goalKey": "ep30Goal",
    "canDoId": "use_bigger_numbers",
    "canDoNameKey": "ep30CanDoName",
    "durationKey": "ep30Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "how_do_i_get_there"
    ],
    "gardenItems": [
      "numbers_11_100"
    ],
    "skillPrerequisites": [
      "use_small_numbers"
    ],
    "role": "primary",
    "reuseSkills": [
      "use_quantity"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "use_quantity",
        "itemIds": [
          "numbers_1_10"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "numbers_11_100"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "numbers_11_100"
      },
      {
        "type": "choice",
        "itemId": "numbers_11_100"
      },
      {
        "type": "fill_blank",
        "itemId": "numbers_11_100"
      },
      {
        "type": "free_reply",
        "evalKind": "use_quantity",
        "itemIds": [
          "numbers_11_100"
        ],
        "quantityForm": "bare"
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "repairKind": "repeat"
      },
      {
        "type": "choice",
        "itemId": "time_at_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "use_quantity",
        "itemIds": [
          "numbers_11_100"
        ],
        "quantityForm": "bare"
      },
      {
        "type": "recall",
        "evalKind": "use_quantity",
        "itemIds": [
          "numbers_11_100"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "how_much_is_it",
    "level": "A1",
    "arc": "paying_and_choosing",
    "titleKey": "ep31Title",
    "goalKey": "ep31Goal",
    "canDoId": "ask_the_price",
    "canDoNameKey": "ep31CanDoName",
    "durationKey": "ep31Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "more_than_ten"
    ],
    "gardenItems": [
      "how_much_pattern",
      "ticket"
    ],
    "skillPrerequisites": [
      "polite_request",
      "use_bigger_numbers"
    ],
    "role": "primary",
    "reuseSkills": [
      "polite_request",
      "use_quantity"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "use_quantity",
        "itemIds": [
          "numbers_11_100"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "how_much_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "dollars"
      },
      {
        "type": "word_order",
        "itemId": "how_much_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "how_much_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_price",
        "itemIds": [
          "how_much_pattern",
          "ticket"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "polite_request",
        "itemIds": [
          "can_i_have",
          "ticket"
        ]
      },
      {
        "type": "choice",
        "itemId": "numbers_11_100"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_price",
        "itemIds": [
          "how_much_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "ask_price",
        "itemIds": [
          "how_much_pattern",
          "ticket"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "this_one_or_that_one",
    "level": "A1",
    "arc": "paying_and_choosing",
    "titleKey": "ep32Title",
    "goalKey": "ep32Goal",
    "canDoId": "ask_the_price",
    "canDoNameKey": "ep32CanDoName",
    "durationKey": "ep32Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "how_much_is_it"
    ],
    "gardenItems": [
      "price_pattern",
      "this_one",
      "that_one"
    ],
    "skillPrerequisites": [
      "ask_the_price",
      "use_small_numbers"
    ],
    "role": "reinforcement",
    "reuseSkills": [
      "use_quantity",
      "express_preference"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "ask_price",
        "itemIds": [
          "how_much_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "this_one",
          "that_one"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "price_pattern"
      },
      {
        "type": "choice",
        "itemId": "this_one"
      },
      {
        "type": "fill_blank",
        "itemId": "that_one"
      },
      {
        "type": "free_reply",
        "evalKind": "use_quantity",
        "itemIds": [
          "this_one",
          "quantity_pattern"
        ],
        "quantityForm": "bare"
      },
      {
        "type": "free_reply",
        "evalKind": "express_like",
        "itemIds": [
          "i_like"
        ]
      },
      {
        "type": "choice",
        "itemId": "banana"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_price",
        "itemIds": [
          "that_one",
          "how_much_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "ask_price",
        "itemIds": [
          "how_much_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "buying_it",
    "level": "A1",
    "arc": "paying_and_choosing",
    "titleKey": "ep33Title",
    "goalKey": "ep33Goal",
    "canDoId": "buy_something",
    "canDoNameKey": "ep33CanDoName",
    "durationKey": "ep33Duration",
    "estimatedMinutes": 10,
    "xp": 85,
    "prerequisites": [
      "this_one_or_that_one"
    ],
    "gardenItems": [
      "dollars"
    ],
    "skillPrerequisites": [
      "ask_the_price",
      "cafe_order",
      "use_small_numbers"
    ],
    "role": "primary",
    "reuseSkills": [
      "ask_price",
      "cafe_order_conversation",
      "polite_request",
      "respond_anything_else",
      "close_encounter"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "ask_price",
        "itemIds": [
          "how_much_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "comprehension",
        "itemId": "thats_all"
      },
      {
        "type": "free_reply",
        "evalKind": "cafe_order_conversation",
        "itemIds": [
          "can_i_have",
          "ticket"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "respond_anything_else",
        "itemIds": [
          "thats_all"
        ]
      },
      {
        "type": "mini_story",
        "storyObjective": "cafe_order_conversation",
        "turns": [
          {
            "kind": "scene"
          },
          {
            "kind": "reply",
            "evalKind": "cafe_order_conversation",
            "itemIds": [
              "can_i_have",
              "ticket"
            ]
          },
          {
            "kind": "line"
          },
          {
            "kind": "choose"
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "finish_order",
            "itemIds": [
              "thats_all"
            ]
          },
          {
            "kind": "close"
          }
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "close_encounter",
        "itemIds": [
          "thank_you",
          "bye"
        ]
      },
      {
        "type": "recall",
        "evalKind": "cafe_order_conversation",
        "itemIds": [
          "can_i_have"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "i_can_i_cant",
    "level": "A1",
    "arc": "what_you_can_do",
    "titleKey": "ep34Title",
    "goalKey": "ep34Goal",
    "canDoId": "say_what_you_can_do",
    "canDoNameKey": "ep34CanDoName",
    "durationKey": "ep34Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "what_does_it_mean"
    ],
    "gardenItems": [
      "can_ability_pattern",
      "swim",
      "cook",
      "drive",
      "dance"
    ],
    "skillPrerequisites": [
      "express_preferences"
    ],
    "role": "primary",
    "reuseSkills": [
      "express_like"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "express_like",
        "itemIds": [
          "i_like"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "can_ability_pattern",
          "swim",
          "cook"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "can_ability_pattern"
      },
      {
        "type": "word_order",
        "itemId": "can_ability_pattern"
      },
      {
        "type": "choice",
        "itemId": "can_ability_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "state_ability",
        "itemIds": [
          "can_ability_pattern",
          "swim"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_ability_pattern"
        ],
        "repairKind": "ask_meaning"
      },
      {
        "type": "free_reply",
        "evalKind": "state_ability",
        "itemIds": [
          "can_ability_pattern",
          "dance"
        ]
      },
      {
        "type": "recall",
        "evalKind": "state_ability",
        "itemIds": [
          "can_ability_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "can_you",
    "level": "A1",
    "arc": "what_you_can_do",
    "titleKey": "ep35Title",
    "goalKey": "ep35Goal",
    "canDoId": "ask_someone_about_ability",
    "canDoNameKey": "ep35CanDoName",
    "durationKey": "ep35Duration",
    "estimatedMinutes": 9,
    "xp": 80,
    "prerequisites": [
      "i_can_i_cant"
    ],
    "gardenItems": [
      "can_you_ability_pattern",
      "how_do_you_say_pattern",
      "sing"
    ],
    "skillPrerequisites": [
      "say_what_you_can_do",
      "ask_about_work_or_study"
    ],
    "role": "primary",
    "reuseSkills": [
      "repair_request"
    ],
    "secondaryCanDoId": "ask_how_to_say_something",
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_ability",
        "itemIds": [
          "can_ability_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "can_you_ability_pattern"
        ]
      },
      {
        "type": "choice",
        "itemId": "can_you_ability_pattern"
      },
      {
        "type": "word_order",
        "itemId": "can_you_ability_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_ability",
        "itemIds": [
          "can_you_ability_pattern",
          "sing"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "repairKind": "repeat"
      },
      {
        "type": "model",
        "meaningItems": [
          "how_do_you_say_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "how_do_you_say_pattern"
        ],
        "repairKind": "ask_how_to_say"
      },
      {
        "type": "comprehension",
        "itemId": "can_ability_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_ability",
        "itemIds": [
          "can_you_ability_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "ask_ability",
        "itemIds": [
          "can_you_ability_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "when_are_you_free",
    "level": "A1",
    "arc": "making_arrangements",
    "titleKey": "ep36Title",
    "goalKey": "ep36Goal",
    "canDoId": "arrange_to_meet",
    "canDoNameKey": "ep36CanDoName",
    "durationKey": "ep36Duration",
    "estimatedMinutes": 10,
    "xp": 85,
    "prerequisites": [
      "can_you"
    ],
    "gardenItems": [
      "day_of_week_pattern",
      "arrange_pattern",
      "monday",
      "friday"
    ],
    "skillPrerequisites": [
      "say_when_something_happens",
      "make_plan",
      "say_where_something_is"
    ],
    "role": "primary",
    "reuseSkills": [
      "simple_plan_conversation",
      "state_routine"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "ask_ability",
        "itemIds": [
          "can_you_ability_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "day_of_week_pattern",
          "arrange_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "day_of_week_pattern"
      },
      {
        "type": "word_order",
        "itemId": "arrange_pattern"
      },
      {
        "type": "choice",
        "itemId": "day_of_week_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "day_of_week_pattern",
          "arrange_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_ability",
        "itemIds": [
          "can_ability_pattern",
          "swim"
        ]
      },
      {
        "type": "choice",
        "itemId": "day_of_week_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "day_of_week_pattern",
          "arrange_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "day_of_week_pattern",
          "arrange_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "where_shall_we_meet",
    "level": "A1",
    "arc": "making_arrangements",
    "titleKey": "ep37Title",
    "goalKey": "ep37Goal",
    "canDoId": "arrange_to_meet",
    "canDoNameKey": "ep37CanDoName",
    "durationKey": "ep37Duration",
    "estimatedMinutes": 9,
    "xp": 80,
    "prerequisites": [
      "when_are_you_free"
    ],
    "gardenItems": [
      "the_station",
      "the_cinema"
    ],
    "skillPrerequisites": [
      "arrange_to_meet",
      "say_where_something_is"
    ],
    "role": "reinforcement",
    "reuseSkills": [
      "state_location",
      "close_encounter"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "arrange_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "its_location_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "its_location_pattern"
      },
      {
        "type": "choice",
        "itemId": "the_station"
      },
      {
        "type": "free_reply",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "the_station",
          "its_location_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "the_cinema",
          "see_you"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "close_encounter",
        "itemIds": [
          "see_you"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "day_of_week_pattern",
          "arrange_pattern",
          "its_location_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "arrange_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "see_you_on_friday",
    "level": "A1",
    "arc": "making_arrangements",
    "titleKey": "ep38Title",
    "goalKey": "ep38Goal",
    "canDoId": "arrange_to_meet",
    "canDoNameKey": "ep38CanDoName",
    "durationKey": "ep38Duration",
    "estimatedMinutes": 12,
    "xp": 100,
    "prerequisites": [
      "where_shall_we_meet"
    ],
    "skillPrerequisites": [
      "arrange_to_meet",
      "introduce_self",
      "ask_wellbeing",
      "express_preferences",
      "ask_for_repair",
      "close_an_encounter"
    ],
    "role": "primary",
    "reuseSkills": [
      "introduction",
      "ask_wellbeing",
      "express_like",
      "repair_request",
      "close_encounter"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "introduction",
        "itemIds": [
          "hi",
          "im"
        ],
        "format": "roleplay",
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_wellbeing",
        "itemIds": [
          "im_good"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "express_like",
        "itemIds": [
          "i_like"
        ],
        "format": "roleplay"
      },
      {
        "type": "mini_story",
        "storyObjective": "arrange_meeting",
        "turns": [
          {
            "kind": "scene"
          },
          {
            "kind": "reply",
            "evalKind": "arrange_meeting",
            "itemIds": [
              "day_of_week_pattern",
              "arrange_pattern"
            ],
            "arrangeStage": "propose"
          },
          {
            "kind": "choose"
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "arrange_meeting",
            "itemIds": [
              "day_of_week_pattern",
              "arrange_pattern",
              "its_location_pattern"
            ],
            "arrangeStage": "confirm"
          },
          {
            "kind": "close"
          }
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "format": "roleplay",
        "repairKind": "repeat"
      },
      {
        "type": "free_reply",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "day_of_week_pattern",
          "arrange_pattern",
          "its_location_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "close_encounter",
        "itemIds": [
          "bye",
          "see_you"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "arrange_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "yesterday",
    "level": "A2",
    "arc": "what_happened",
    "titleKey": "ep39Title",
    "goalKey": "ep39Goal",
    "canDoId": "talk_about_what_you_did",
    "canDoNameKey": "ep39CanDoName",
    "durationKey": "ep39Duration",
    "estimatedMinutes": 10,
    "xp": 80,
    "gardenItems": [
      "simple_past_regular_pattern",
      "past_time_expression_pattern",
      "watch_tv",
      "cook_dinner",
      "clean_the_house"
    ],
    "skillPrerequisites": [
      "talk_about_daily_routine"
    ],
    "role": "primary",
    "reuseSkills": [
      "talk_about_daily_routine",
      "use_small_numbers"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_routine",
        "itemIds": [
          "frequency_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "simple_past_regular_pattern",
          "past_time_expression_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "past_time_expression_pattern"
      },
      {
        "type": "word_order",
        "itemId": "simple_past_regular_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "clean_the_house"
      },
      {
        "type": "free_reply",
        "evalKind": "state_past_event",
        "itemIds": [
          "simple_past_regular_pattern",
          "past_time_expression_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "use_quantity",
        "itemIds": [
          "numbers_1_10"
        ],
        "quantityForm": "bare"
      },
      {
        "type": "choice",
        "itemId": "past_time_expression_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "state_past_event",
        "itemIds": [
          "simple_past_regular_pattern",
          "past_time_expression_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "state_past_event",
        "itemIds": [
          "simple_past_regular_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "i_went_i_had",
    "level": "A2",
    "arc": "what_happened",
    "titleKey": "ep40Title",
    "goalKey": "ep40Goal",
    "canDoId": "talk_about_what_you_did",
    "canDoNameKey": "ep40CanDoName",
    "durationKey": "ep40Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "yesterday"
    ],
    "gardenItems": [
      "simple_past_irregular_pattern"
    ],
    "reinforces": true,
    "skillPrerequisites": [
      "talk_about_what_you_did"
    ],
    "role": "reinforcement",
    "reuseSkills": [
      "talk_about_daily_routine"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_past_event",
        "itemIds": [
          "simple_past_regular_pattern"
        ],
        "review": true
      },
      {
        "type": "model",
        "meaningItems": [
          "simple_past_irregular_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "simple_past_irregular_pattern"
      },
      {
        "type": "choice",
        "itemId": "simple_past_irregular_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "simple_past_irregular_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "state_past_event",
        "itemIds": [
          "simple_past_irregular_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_routine",
        "itemIds": [
          "frequency_pattern"
        ]
      },
      {
        "type": "choice",
        "itemId": "simple_past_irregular_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "state_past_event",
        "itemIds": [
          "simple_past_irregular_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "state_past_event",
        "itemIds": [
          "simple_past_irregular_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "what_did_you_do",
    "level": "A2",
    "arc": "what_happened",
    "titleKey": "ep41Title",
    "goalKey": "ep41Goal",
    "canDoId": "ask_about_what_someone_did",
    "canDoNameKey": "ep41CanDoName",
    "durationKey": "ep41Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "i_went_i_had"
    ],
    "gardenItems": [
      "did_you_question_pattern"
    ],
    "skillPrerequisites": [
      "talk_about_what_you_did",
      "ask_about_work_or_study"
    ],
    "role": "primary",
    "reuseSkills": [
      "ask_about_work_or_study",
      "ask_for_repair"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_past_event",
        "itemIds": [
          "simple_past_irregular_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "did_you_question_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "simple_past_irregular_pattern"
      },
      {
        "type": "word_order",
        "itemId": "did_you_question_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "did_you_question_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_past_event",
        "itemIds": [
          "did_you_question_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_life_fact",
        "itemIds": [
          "do_you_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat",
          "bought"
        ],
        "repairKind": "repeat"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_past_event",
        "itemIds": [
          "did_you_question_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "ask_past_event",
        "itemIds": [
          "did_you_question_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "first_then",
    "level": "A2",
    "arc": "what_happened",
    "titleKey": "ep42Title",
    "goalKey": "ep42Goal",
    "canDoId": "narrate_a_sequence_of_past_events",
    "canDoNameKey": "ep42CanDoName",
    "durationKey": "ep42Duration",
    "estimatedMinutes": 11,
    "xp": 90,
    "prerequisites": [
      "what_did_you_do"
    ],
    "gardenItems": [
      "sequencing_connector_pattern"
    ],
    "skillPrerequisites": [
      "talk_about_what_you_did",
      "ask_about_what_someone_did"
    ],
    "role": "primary",
    "reuseSkills": [
      "talk_about_what_you_did",
      "ask_about_what_someone_did"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "ask_past_event",
        "itemIds": [
          "did_you_question_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "comprehension",
        "itemId": "sequencing_connector_pattern"
      },
      {
        "type": "mini_story",
        "storyObjective": "past_day_story",
        "turns": [
          {
            "kind": "scene"
          },
          {
            "kind": "line"
          },
          {
            "kind": "choose"
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "narrate_past_sequence",
            "itemIds": [
              "sequencing_connector_pattern",
              "simple_past_irregular_pattern"
            ]
          },
          {
            "kind": "reply",
            "evalKind": "state_past_event",
            "itemIds": [
              "simple_past_regular_pattern",
              "past_time_expression_pattern"
            ]
          },
          {
            "kind": "close"
          }
        ]
      },
      {
        "type": "choice",
        "itemId": "sequencing_connector_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "sequencing_connector_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "narrate_past_sequence",
        "itemIds": [
          "sequencing_connector_pattern",
          "simple_past_irregular_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_past_event",
        "itemIds": [
          "did_you_question_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "narrate_past_sequence",
        "itemIds": [
          "sequencing_connector_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "narrate_past_sequence",
        "itemIds": [
          "sequencing_connector_pattern",
          "simple_past_irregular_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "narrate_past_sequence",
        "itemIds": [
          "sequencing_connector_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "im_going_to",
    "level": "A2",
    "arc": "making_plans",
    "titleKey": "ep43Title",
    "goalKey": "ep43Goal",
    "canDoId": "talk_about_future_plans",
    "canDoNameKey": "ep43CanDoName",
    "durationKey": "ep43Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "gardenItems": [
      "going_to_future_pattern",
      "future_time_expression_pattern",
      "relax",
      "go_shopping"
    ],
    "skillPrerequisites": [
      "arrange_to_meet",
      "say_when_something_happens",
      "talk_about_what_you_did"
    ],
    "role": "primary",
    "reuseSkills": [
      "talk_about_what_you_did",
      "narrate_a_sequence_of_past_events",
      "arrange_to_meet"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_past_event",
        "itemIds": [
          "past_time_expression_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "going_to_future_pattern",
          "future_time_expression_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "future_time_expression_pattern"
      },
      {
        "type": "choice",
        "itemId": "going_to_future_pattern"
      },
      {
        "type": "word_order",
        "itemId": "going_to_future_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "going_to_future_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "state_future_plan",
        "itemIds": [
          "going_to_future_pattern",
          "future_time_expression_pattern",
          "relax"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "day_of_week_pattern",
          "arrange_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_future_plan",
        "itemIds": [
          "going_to_future_pattern",
          "future_time_expression_pattern",
          "go_shopping"
        ]
      },
      {
        "type": "recall",
        "evalKind": "state_future_plan",
        "itemIds": [
          "going_to_future_pattern",
          "future_time_expression_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "are_you_going_to",
    "level": "A2",
    "arc": "making_plans",
    "titleKey": "ep44Title",
    "goalKey": "ep44Goal",
    "canDoId": "ask_about_future_plans",
    "canDoNameKey": "ep44CanDoName",
    "durationKey": "ep44Duration",
    "estimatedMinutes": 7,
    "xp": 60,
    "prerequisites": [
      "im_going_to"
    ],
    "gardenItems": [
      "going_to_question_pattern",
      "visit"
    ],
    "skillPrerequisites": [
      "talk_about_future_plans"
    ],
    "role": "primary",
    "reuseSkills": [
      "talk_about_future_plans"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_future_plan",
        "itemIds": [
          "going_to_future_pattern"
        ],
        "review": true
      },
      {
        "type": "model",
        "meaningItems": [
          "going_to_question_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "going_to_future_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "going_to_question_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_future_plan",
        "itemIds": [
          "going_to_question_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_future_plan",
        "itemIds": [
          "going_to_future_pattern",
          "visit"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_future_plan",
        "itemIds": [
          "going_to_question_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "ask_future_plan",
        "itemIds": [
          "going_to_question_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "small_quiet_place",
    "level": "A2",
    "arc": "people_and_places",
    "titleKey": "ep45Title",
    "goalKey": "ep45Goal",
    "canDoId": "describe_a_person_or_place",
    "canDoNameKey": "ep45CanDoName",
    "durationKey": "ep45Duration",
    "estimatedMinutes": 10,
    "xp": 85,
    "gardenItems": [
      "multi_attribute_pattern",
      "there_is_are_pattern",
      "third_person_s_pattern",
      "frequency_full_set_pattern",
      "small",
      "quiet",
      "big",
      "friendly",
      "always",
      "never"
    ],
    "skillPrerequisites": [
      "introduce_someone_else",
      "say_where_something_is"
    ],
    "role": "primary",
    "reuseSkills": [
      "introduce_someone_else",
      "say_where_something_is"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_person_fact",
        "itemIds": [
          "he_she_is_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "multi_attribute_pattern",
          "small",
          "quiet",
          "big",
          "friendly"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "modern"
      },
      {
        "type": "word_order",
        "itemId": "there_is_are_pattern"
      },
      {
        "type": "word_order",
        "itemId": "third_person_s_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "frequency_full_set_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "describe_person_or_place",
        "itemIds": [
          "multi_attribute_pattern",
          "friendly",
          "quiet"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "describe_person_or_place",
        "itemIds": [
          "multi_attribute_pattern",
          "there_is_are_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "describe_person_or_place",
        "itemIds": [
          "multi_attribute_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "bigger_quieter_cheaper",
    "level": "A2",
    "arc": "people_and_places",
    "titleKey": "ep46Title",
    "goalKey": "ep46Goal",
    "canDoId": "compare_two_things",
    "canDoNameKey": "ep46CanDoName",
    "durationKey": "ep46Duration",
    "estimatedMinutes": 9,
    "xp": 78,
    "prerequisites": [
      "small_quiet_place"
    ],
    "gardenItems": [
      "comparative_pattern",
      "expensive",
      "cheap"
    ],
    "skillPrerequisites": [
      "describe_a_person_or_place"
    ],
    "role": "primary",
    "reuseSkills": [
      "describe_a_person_or_place"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "describe_person_or_place",
        "itemIds": [
          "multi_attribute_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "comparative_pattern",
          "expensive"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "better"
      },
      {
        "type": "choice",
        "itemId": "comparative_pattern"
      },
      {
        "type": "word_order",
        "itemId": "comparative_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "comparative_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "compare_things",
        "itemIds": [
          "comparative_pattern",
          "quiet"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "compare_things",
        "itemIds": [
          "comparative_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "compare_things",
        "itemIds": [
          "comparative_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "i_like_it_because",
    "level": "A2",
    "arc": "people_and_places",
    "titleKey": "ep47Title",
    "goalKey": "ep47Goal",
    "canDoId": "express_an_opinion_with_a_reason",
    "canDoNameKey": "ep47CanDoName",
    "durationKey": "ep47Duration",
    "estimatedMinutes": 9,
    "xp": 78,
    "prerequisites": [
      "bigger_quieter_cheaper"
    ],
    "gardenItems": [
      "because_reason_pattern",
      "convenient"
    ],
    "skillPrerequisites": [
      "compare_two_things"
    ],
    "role": "primary",
    "reuseSkills": [
      "compare_two_things"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "compare_things",
        "itemIds": [
          "comparative_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "because_reason_pattern",
          "convenient"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "comfortable"
      },
      {
        "type": "choice",
        "itemId": "because_reason_pattern"
      },
      {
        "type": "word_order",
        "itemId": "because_reason_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "state_opinion_with_reason",
        "itemIds": [
          "because_reason_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_opinion_with_reason",
        "itemIds": [
          "because_reason_pattern",
          "comparative_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "state_opinion_with_reason",
        "itemIds": [
          "because_reason_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "which_one_would_you_choose",
    "level": "A2",
    "arc": "people_and_places",
    "titleKey": "ep48Title",
    "goalKey": "ep48Goal",
    "canDoId": "describe_a_person_or_place",
    "canDoNameKey": "ep48CanDoName",
    "durationKey": "ep48Duration",
    "estimatedMinutes": 11,
    "xp": 90,
    "prerequisites": [
      "i_like_it_because"
    ],
    "reinforces": true,
    "skillPrerequisites": [
      "describe_a_person_or_place",
      "compare_two_things",
      "express_an_opinion_with_a_reason"
    ],
    "role": "reinforcement",
    "reuseSkills": [
      "describe_a_person_or_place",
      "compare_two_things",
      "express_an_opinion_with_a_reason"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_opinion_with_reason",
        "itemIds": [
          "because_reason_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "mini_story",
        "storyObjective": "compare_two_places_story",
        "turns": [
          {
            "kind": "scene"
          },
          {
            "kind": "line"
          },
          {
            "kind": "choose"
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "describe_person_or_place",
            "itemIds": [
              "multi_attribute_pattern"
            ]
          },
          {
            "kind": "line"
          },
          {
            "kind": "close"
          }
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "compare_things",
        "itemIds": [
          "comparative_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "state_opinion_with_reason",
        "itemIds": [
          "because_reason_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "state_opinion_with_reason",
        "itemIds": [
          "because_reason_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "describe_person_or_place",
        "itemIds": [
          "multi_attribute_pattern",
          "comparative_pattern",
          "because_reason_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "turn_left_then",
    "level": "A2",
    "arc": "getting_around",
    "titleKey": "ep49Title",
    "goalKey": "ep49Goal",
    "canDoId": "follow_directions_with_more_than_one_step",
    "canDoNameKey": "ep49CanDoName",
    "durationKey": "ep49Duration",
    "estimatedMinutes": 10,
    "xp": 85,
    "gardenItems": [
      "multi_step_direction_pattern",
      "straight",
      "turn",
      "left",
      "right"
    ],
    "skillPrerequisites": [
      "ask_where_something_is",
      "narrate_a_sequence_of_past_events"
    ],
    "role": "primary",
    "reuseSkills": [
      "ask_where_something_is",
      "ask_for_repair"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "recall",
        "evalKind": "ask_location",
        "itemIds": [
          "where_is_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "multi_step_direction_pattern",
          "straight",
          "turn",
          "left",
          "right"
        ]
      },
      {
        "type": "choice",
        "itemId": "next_to"
      },
      {
        "type": "word_order",
        "itemId": "multi_step_direction_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "multi_step_direction_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_location",
        "itemIds": [
          "where_is_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "repairKind": "repeat"
      },
      {
        "type": "comprehension",
        "itemId": "bank"
      },
      {
        "type": "free_reply",
        "evalKind": "give_multi_step_directions",
        "itemIds": [
          "multi_step_direction_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "give_multi_step_directions",
        "itemIds": [
          "multi_step_direction_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "go_straight_then_turn_right",
    "level": "A2",
    "arc": "getting_around",
    "titleKey": "ep50Title",
    "goalKey": "ep50Goal",
    "canDoId": "give_simple_directions",
    "canDoNameKey": "ep50CanDoName",
    "durationKey": "ep50Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "turn_left_then"
    ],
    "gardenItems": [
      "corner",
      "crossing"
    ],
    "skillPrerequisites": [
      "follow_directions_with_more_than_one_step",
      "say_where_something_is"
    ],
    "role": "primary",
    "reuseSkills": [
      "follow_directions_with_more_than_one_step",
      "say_where_something_is"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "give_multi_step_directions",
        "itemIds": [
          "multi_step_direction_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "corner"
        ]
      },
      {
        "type": "fill_blank",
        "itemId": "multi_step_direction_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "give_multi_step_directions",
        "itemIds": [
          "multi_step_direction_pattern",
          "corner"
        ],
        "format": "roleplay"
      },
      {
        "type": "choice",
        "itemId": "which_way"
      },
      {
        "type": "free_reply",
        "evalKind": "give_multi_step_directions",
        "itemIds": [
          "multi_step_direction_pattern",
          "crossing"
        ],
        "format": "roleplay"
      },
      {
        "type": "comprehension",
        "itemId": "church"
      },
      {
        "type": "recall",
        "evalKind": "give_multi_step_directions",
        "itemIds": [
          "multi_step_direction_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "the_tenth_of_june",
    "level": "A2",
    "arc": "booking_a_stay",
    "titleKey": "ep51Title",
    "goalKey": "ep51Goal",
    "canDoId": "use_dates_and_months",
    "canDoNameKey": "ep51CanDoName",
    "durationKey": "ep51Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "gardenItems": [
      "month_pattern",
      "ordinal_date_pattern"
    ],
    "skillPrerequisites": [
      "use_bigger_numbers",
      "talk_about_future_plans"
    ],
    "role": "primary",
    "reuseSkills": [
      "use_bigger_numbers",
      "ask_for_repair"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_future_plan",
        "itemIds": [
          "going_to_future_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "month_pattern",
          "ordinal_date_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "ordinal_date_pattern"
      },
      {
        "type": "choice",
        "itemId": "day_of_week_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "ordinal_date_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "use_quantity",
        "itemIds": [
          "ordinal_date_pattern",
          "month_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_repeat"
        ],
        "repairKind": "repeat"
      },
      {
        "type": "free_reply",
        "evalKind": "use_quantity",
        "itemIds": [
          "ordinal_date_pattern",
          "month_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "use_quantity",
        "itemIds": [
          "ordinal_date_pattern",
          "month_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "do_you_have_a_table",
    "level": "A2",
    "arc": "booking_a_stay",
    "titleKey": "ep52Title",
    "goalKey": "ep52Goal",
    "canDoId": "ask_about_availability",
    "canDoNameKey": "ep52CanDoName",
    "durationKey": "ep52Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "prerequisites": [
      "the_tenth_of_june"
    ],
    "gardenItems": [
      "availability_question_pattern",
      "table"
    ],
    "skillPrerequisites": [
      "use_dates_and_months",
      "ask_the_price"
    ],
    "role": "primary",
    "reuseSkills": [
      "ask_the_price",
      "use_dates_and_months"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "use_quantity",
        "itemIds": [
          "ordinal_date_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "availability_question_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "availability_question_pattern"
      },
      {
        "type": "word_order",
        "itemId": "availability_question_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_availability",
        "itemIds": [
          "availability_question_pattern",
          "ordinal_date_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_price",
        "itemIds": [
          "how_much_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_availability",
        "itemIds": [
          "availability_question_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "ask_availability",
        "itemIds": [
          "availability_question_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "id_like_to_book",
    "level": "A2",
    "arc": "booking_a_stay",
    "titleKey": "ep53Title",
    "goalKey": "ep53Goal",
    "canDoId": "book_a_room_or_table",
    "canDoNameKey": "ep53CanDoName",
    "durationKey": "ep53Duration",
    "estimatedMinutes": 10,
    "xp": 85,
    "prerequisites": [
      "do_you_have_a_table"
    ],
    "gardenItems": [
      "booking_pattern",
      "deposit"
    ],
    "skillPrerequisites": [
      "ask_about_availability",
      "arrange_to_meet"
    ],
    "role": "primary",
    "reuseSkills": [
      "ask_about_availability",
      "arrange_to_meet"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "ask_availability",
        "itemIds": [
          "availability_question_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "booking_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "deposit"
      },
      {
        "type": "fill_blank",
        "itemId": "booking_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "use_quantity",
        "itemIds": [
          "booking_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "polite_request",
        "itemIds": [
          "can_i_have"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "make_booking",
        "itemIds": [
          "booking_pattern",
          "ordinal_date_pattern",
          "month_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "arrange_meeting",
        "itemIds": [
          "time_at_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "make_booking",
        "itemIds": [
          "booking_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "make_booking",
        "itemIds": [
          "booking_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "can_you_spell_that",
    "level": "A2",
    "arc": "booking_a_stay",
    "titleKey": "ep54Title",
    "goalKey": "ep54Goal",
    "canDoId": "spell_a_name_for_a_booking",
    "canDoNameKey": "ep54CanDoName",
    "durationKey": "ep54Duration",
    "estimatedMinutes": 11,
    "xp": 90,
    "prerequisites": [
      "id_like_to_book"
    ],
    "gardenItems": [
      "spelling_pattern",
      "can_you_spell_that"
    ],
    "reinforces": true,
    "skillPrerequisites": [
      "book_a_room_or_table"
    ],
    "role": "reinforcement",
    "reuseSkills": [
      "book_a_room_or_table",
      "use_dates_and_months",
      "polite_request",
      "close_an_encounter"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_availability",
        "itemIds": [
          "availability_question_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "make_booking",
        "itemIds": [
          "booking_pattern",
          "ordinal_date_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "spell_word",
        "itemIds": [
          "spelling_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "choice",
        "itemId": "spelling_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "repair_request",
        "itemIds": [
          "can_you_spell_that"
        ],
        "format": "roleplay",
        "repairKind": "ask_to_spell"
      },
      {
        "type": "mini_story",
        "storyObjective": "booking_call_story",
        "turns": [
          {
            "kind": "scene"
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "make_booking",
            "itemIds": [
              "booking_pattern",
              "ordinal_date_pattern"
            ]
          },
          {
            "kind": "choose"
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "spell_word",
            "itemIds": [
              "spelling_pattern"
            ]
          },
          {
            "kind": "close"
          }
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "close_encounter",
        "itemIds": [
          "thank_you",
          "bye"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "spell_word",
        "itemIds": [
          "spelling_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "theres_a_problem",
    "level": "A2",
    "arc": "everyday_problems",
    "titleKey": "ep55Title",
    "goalKey": "ep55Goal",
    "canDoId": "report_a_problem",
    "canDoNameKey": "ep55CanDoName",
    "durationKey": "ep55Duration",
    "estimatedMinutes": 8,
    "xp": 70,
    "gardenItems": [
      "problem_with",
      "doesnt_work",
      "lost",
      "cold",
      "problem_report_pattern"
    ],
    "skillPrerequisites": [
      "ask_for_repair",
      "book_a_room_or_table"
    ],
    "role": "primary",
    "reuseSkills": [
      "book_a_room_or_table",
      "ask_for_repair"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "recall",
        "evalKind": "make_booking",
        "itemIds": [
          "booking_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "problem_with",
          "cold"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "sorry_about_that"
      },
      {
        "type": "word_order",
        "itemId": "problem_report_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "doesnt_work"
      },
      {
        "type": "free_reply",
        "evalKind": "report_problem",
        "itemIds": [
          "problem_with",
          "cold",
          "problem_report_pattern"
        ]
      },
      {
        "type": "choice",
        "itemId": "lost"
      },
      {
        "type": "free_reply",
        "evalKind": "report_problem",
        "itemIds": [
          "problem_with",
          "cold",
          "doesnt_work"
        ]
      },
      {
        "type": "recall",
        "evalKind": "report_problem",
        "itemIds": [
          "problem_report_pattern",
          "cold"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "what_should_i_do",
    "level": "A2",
    "arc": "everyday_problems",
    "titleKey": "ep56Title",
    "goalKey": "ep56Goal",
    "canDoId": "ask_for_help_solving_a_problem",
    "canDoNameKey": "ep56CanDoName",
    "durationKey": "ep56Duration",
    "estimatedMinutes": 8,
    "xp": 70,
    "prerequisites": [
      "theres_a_problem"
    ],
    "gardenItems": [
      "help_with",
      "what_should_i_do",
      "fix",
      "help_request_pattern"
    ],
    "skillPrerequisites": [
      "report_a_problem"
    ],
    "role": "primary",
    "reuseSkills": [
      "polite_request",
      "report_a_problem"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "report_problem",
        "itemIds": [
          "problem_report_pattern"
        ],
        "review": true
      },
      {
        "type": "model",
        "meaningItems": [
          "help_with",
          "what_should_i_do"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "of_course"
      },
      {
        "type": "word_order",
        "itemId": "help_request_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "help_request_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_for_help",
        "itemIds": [
          "help_with",
          "help_request_pattern",
          "what_should_i_do"
        ]
      },
      {
        "type": "choice",
        "itemId": "extra_blankets"
      },
      {
        "type": "free_reply",
        "evalKind": "polite_request",
        "itemIds": [
          "can_i_have",
          "please",
          "fix"
        ]
      },
      {
        "type": "recall",
        "evalKind": "ask_for_help",
        "itemIds": [
          "help_request_pattern",
          "what_should_i_do"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "fixed",
    "level": "A2",
    "arc": "everyday_problems",
    "titleKey": "ep57Title",
    "goalKey": "ep57Goal",
    "canDoId": "report_a_problem",
    "canDoNameKey": "ep57CanDoName",
    "durationKey": "ep57Duration",
    "estimatedMinutes": 10,
    "xp": 80,
    "prerequisites": [
      "what_should_i_do"
    ],
    "gardenItems": [
      "instead"
    ],
    "reinforces": true,
    "skillPrerequisites": [
      "report_a_problem",
      "ask_for_help_solving_a_problem",
      "book_a_room_or_table"
    ],
    "role": "reinforcement",
    "reuseSkills": [
      "report_a_problem",
      "ask_for_help_solving_a_problem",
      "book_a_room_or_table"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "report_problem",
        "itemIds": [
          "problem_report_pattern",
          "help_request_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "report_problem",
        "itemIds": [
          "problem_report_pattern",
          "cold"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "state_opinion_with_reason",
        "itemIds": [
          "instead",
          "help_request_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "thank_service",
        "itemIds": [
          "thank_you"
        ],
        "format": "roleplay"
      },
      {
        "type": "mini_story",
        "storyObjective": "problem_resolution_story",
        "turns": [
          {
            "kind": "scene"
          },
          {
            "kind": "reply",
            "evalKind": "report_problem",
            "itemIds": [
              "doesnt_work",
              "problem_report_pattern"
            ]
          },
          {
            "kind": "line"
          },
          {
            "kind": "choose"
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "thank_service",
            "itemIds": [
              "thank_you"
            ]
          },
          {
            "kind": "close"
          }
        ]
      },
      {
        "type": "recall",
        "evalKind": "report_problem",
        "itemIds": [
          "problem_report_pattern",
          "help_request_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "do_you_want_to",
    "level": "A2",
    "arc": "lets_do_something",
    "titleKey": "ep58Title",
    "goalKey": "ep58Goal",
    "canDoId": "invite_someone_to_do_something",
    "canDoNameKey": "ep58CanDoName",
    "durationKey": "ep58Duration",
    "estimatedMinutes": 9,
    "xp": 75,
    "gardenItems": [
      "invitation_pattern",
      "go_to_the_cinema",
      "have_dinner"
    ],
    "skillPrerequisites": [
      "talk_about_future_plans",
      "arrange_to_meet"
    ],
    "role": "primary",
    "reuseSkills": [
      "talk_about_future_plans",
      "express_preferences"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_future_plan",
        "itemIds": [
          "going_to_future_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "invitation_pattern",
          "go_to_the_cinema",
          "have_dinner"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "invitation_pattern"
      },
      {
        "type": "word_order",
        "itemId": "invitation_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "invitation_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "invite_someone",
        "itemIds": [
          "invitation_pattern",
          "go_to_the_cinema"
        ]
      },
      {
        "type": "choice",
        "itemId": "invitation_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "invite_someone",
        "itemIds": [
          "invitation_pattern",
          "have_dinner"
        ]
      },
      {
        "type": "recall",
        "evalKind": "invite_someone",
        "itemIds": [
          "invitation_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "id_love_to_but",
    "level": "A2",
    "arc": "lets_do_something",
    "titleKey": "ep59Title",
    "goalKey": "ep59Goal",
    "canDoId": "accept_or_decline_with_a_reason",
    "canDoNameKey": "ep59CanDoName",
    "durationKey": "ep59Duration",
    "estimatedMinutes": 10,
    "xp": 80,
    "prerequisites": [
      "do_you_want_to"
    ],
    "gardenItems": [
      "accept_decline_reason_pattern",
      "id_love_to",
      "im_busy"
    ],
    "skillPrerequisites": [
      "invite_someone_to_do_something",
      "express_an_opinion_with_a_reason"
    ],
    "role": "primary",
    "reuseSkills": [
      "invite_someone_to_do_something",
      "express_an_opinion_with_a_reason"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "invite_someone",
        "itemIds": [
          "invitation_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "accept_decline_reason_pattern",
          "id_love_to",
          "im_busy"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "accept_decline_reason_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "im_busy"
      },
      {
        "type": "choice",
        "itemId": "accept_decline_reason_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "accept_decline_reason_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "accept_decline_reason_pattern",
          "im_busy"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "accept_decline_reason_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "accept_decline_reason_pattern",
          "im_busy"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "and_then",
    "level": "A2",
    "arc": "lets_do_something",
    "titleKey": "ep60Title",
    "goalKey": "ep60Goal",
    "canDoId": "keep_a_longer_conversation_going",
    "canDoNameKey": "ep60CanDoName",
    "durationKey": "ep60Duration",
    "estimatedMinutes": 10,
    "xp": 80,
    "prerequisites": [
      "id_love_to_but"
    ],
    "gardenItems": [
      "clause_connector_pattern",
      "last_time",
      "really_good"
    ],
    "skillPrerequisites": [
      "accept_or_decline_with_a_reason",
      "ask_what_something_means"
    ],
    "role": "primary",
    "reuseSkills": [
      "accept_or_decline_with_a_reason",
      "narrate_a_sequence_of_past_events",
      "ask_what_something_means"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "accept_decline_reason_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "clause_connector_pattern",
          "last_time",
          "really_good"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "clause_connector_pattern"
      },
      {
        "type": "choice",
        "itemId": "what_does_mean_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "clause_connector_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "accept_decline_reason_pattern",
          "clause_connector_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "clause_connector_pattern",
          "accept_decline_reason_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "clause_connector_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "lets_do_something_else",
    "level": "A2",
    "arc": "lets_do_something",
    "titleKey": "ep61Title",
    "goalKey": "ep61Goal",
    "canDoId": "accept_or_decline_with_a_reason",
    "canDoNameKey": "ep61CanDoName",
    "durationKey": "ep61Duration",
    "estimatedMinutes": 14,
    "xp": 110,
    "prerequisites": [
      "and_then"
    ],
    "gardenItems": [
      "go_for_a_walk"
    ],
    "skillPrerequisites": [
      "invite_someone_to_do_something",
      "accept_or_decline_with_a_reason",
      "keep_a_longer_conversation_going"
    ],
    "role": "primary",
    "reuseSkills": [
      "invite_someone_to_do_something",
      "accept_or_decline_with_a_reason",
      "keep_a_longer_conversation_going",
      "talk_about_future_plans",
      "arrange_to_meet",
      "report_a_problem"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_past_event",
        "itemIds": [
          "simple_past_regular_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "invite_someone",
        "itemIds": [
          "invitation_pattern",
          "go_to_the_cinema"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "problem_report_pattern"
      },
      {
        "type": "mini_story",
        "storyObjective": "closing_invitation_story",
        "turns": [
          {
            "kind": "scene"
          },
          {
            "kind": "reply",
            "evalKind": "invite_someone",
            "itemIds": [
              "invitation_pattern",
              "go_to_the_cinema"
            ]
          },
          {
            "kind": "line"
          },
          {
            "kind": "choose"
          },
          {
            "kind": "line"
          },
          {
            "kind": "reply",
            "evalKind": "respond_to_invitation",
            "itemIds": [
              "accept_decline_reason_pattern",
              "going_to_future_pattern"
            ]
          },
          {
            "kind": "close"
          }
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "accept_decline_reason_pattern",
          "clause_connector_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "invite_someone",
        "itemIds": [
          "invitation_pattern",
          "go_for_a_walk",
          "go_to_the_cinema"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "clause_connector_pattern",
          "because_reason_pattern",
          "last_time"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "accept_decline_reason_pattern",
          "going_to_future_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "close_encounter",
        "itemIds": [
          "bye"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "respond_to_invitation",
        "itemIds": [
          "accept_decline_reason_pattern",
          "clause_connector_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "one_thing_after_another",
    "level": "B1",
    "arc": "what_happened",
    "titleKey": "b1Ep1Title",
    "goalKey": "b1Ep1Goal",
    "canDoId": "narrate_connected_event",
    "canDoNameKey": "b1Ep1CanDoName",
    "durationKey": "b1Ep1Duration",
    "estimatedMinutes": 9,
    "xp": 80,
    "gardenItems": [
      "b1_first",
      "b1_then",
      "b1_after_that",
      "b1_before_that",
      "b1_finally",
      "b1_sequence_connectors_pattern"
    ],
    "skillPrerequisites": [
      "talk_about_what_you_did"
    ],
    "role": "primary",
    "reuseSkills": [
      "talk_about_what_you_did"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_first",
          "b1_then",
          "b1_after_that",
          "b1_finally"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_then"
      },
      {
        "type": "word_order",
        "itemId": "b1_after_that"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_then"
      },
      {
        "type": "free_reply",
        "evalKind": "narrate_past_event",
        "itemIds": [
          "b1_first",
          "b1_then",
          "b1_after_that",
          "b1_finally",
          "b1_sequence_connectors_pattern"
        ],
        "placeholders": [
          "name"
        ]
      }
    ]
  },
  {
    "id": "when_it_happened",
    "level": "B1",
    "arc": "what_happened",
    "titleKey": "b1Ep2Title",
    "goalKey": "b1Ep2Goal",
    "canDoId": "narrate_interrupted_action",
    "canDoNameKey": "b1Ep2CanDoName",
    "durationKey": "b1Ep2Duration",
    "estimatedMinutes": 10,
    "xp": 85,
    "prerequisites": [
      "one_thing_after_another"
    ],
    "gardenItems": [
      "b1_past_continuous_pattern",
      "b1_when_while_pattern",
      "b1_suddenly",
      "b1_just_then"
    ],
    "skillPrerequisites": [
      "talk_about_what_you_did"
    ],
    "role": "primary",
    "reuseSkills": [
      "narrate_connected_event"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_past_continuous_pattern",
          "b1_when_while_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_when_while_pattern"
      },
      {
        "type": "word_order",
        "itemId": "b1_past_continuous_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_past_continuous_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "narrate_past_event",
        "itemIds": [
          "b1_past_continuous_pattern",
          "b1_when_while_pattern",
          "b1_suddenly"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "narrate_past_event",
        "itemIds": [
          "b1_past_continuous_pattern",
          "b1_when_while_pattern",
          "b1_just_then"
        ]
      }
    ]
  },
  {
    "id": "the_whole_story",
    "level": "B1",
    "arc": "what_happened",
    "titleKey": "b1Ep3Title",
    "goalKey": "b1Ep3Goal",
    "canDoId": "narrate_interrupted_action",
    "canDoNameKey": "b1Ep3CanDoName",
    "durationKey": "b1Ep3Duration",
    "estimatedMinutes": 9,
    "xp": 90,
    "prerequisites": [
      "one_thing_after_another",
      "when_it_happened"
    ],
    "reinforces": true,
    "skillPrerequisites": [
      "talk_about_what_you_did"
    ],
    "role": "reinforcement",
    "reuseSkills": [
      "narrate_connected_event",
      "talk_about_what_you_did"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "narrate_past_event",
        "itemIds": [
          "b1_first",
          "b1_then",
          "b1_after_that",
          "b1_finally",
          "b1_past_continuous_pattern",
          "b1_when_while_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_when_while_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "narrate_past_event",
        "itemIds": [
          "b1_past_continuous_pattern",
          "b1_when_while_pattern"
        ]
      }
    ]
  },
  {
    "id": "what_i_think",
    "level": "B1",
    "arc": "i_think_that",
    "titleKey": "b1Ep4Title",
    "goalKey": "b1Ep4Goal",
    "canDoId": "give_an_opinion",
    "canDoNameKey": "b1Ep4CanDoName",
    "durationKey": "b1Ep4Duration",
    "estimatedMinutes": 8,
    "xp": 80,
    "gardenItems": [
      "b1_i_think_that",
      "b1_in_my_opinion",
      "b1_personally",
      "b1_opinion_frame_pattern",
      "b1_because_reason_pattern"
    ],
    "skillPrerequisites": [
      "express_an_opinion_with_a_reason"
    ],
    "role": "primary",
    "reuseSkills": [
      "express_an_opinion_with_a_reason"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_i_think_that",
          "b1_in_my_opinion",
          "b1_opinion_frame_pattern",
          "b1_because_reason_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_opinion_frame_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_opinion_frame_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "state_opinion",
        "itemIds": [
          "b1_i_think_that",
          "b1_in_my_opinion",
          "b1_opinion_frame_pattern",
          "b1_because_reason_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_opinion",
        "itemIds": [
          "b1_personally",
          "b1_opinion_frame_pattern",
          "b1_because_reason_pattern"
        ]
      }
    ]
  },
  {
    "id": "agree_to_disagree",
    "level": "B1",
    "arc": "i_think_that",
    "titleKey": "b1Ep5Title",
    "goalKey": "b1Ep5Goal",
    "canDoId": "agree_or_disagree",
    "canDoNameKey": "b1Ep5CanDoName",
    "durationKey": "b1Ep5Duration",
    "estimatedMinutes": 9,
    "xp": 85,
    "prerequisites": [
      "what_i_think"
    ],
    "gardenItems": [
      "b1_i_agree",
      "b1_i_dont_think_so",
      "b1_youre_right",
      "b1_agree_disagree_pattern",
      "b1_i_see_what_you_mean"
    ],
    "skillPrerequisites": [
      "express_an_opinion_with_a_reason"
    ],
    "role": "primary",
    "reuseSkills": [
      "give_an_opinion"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_i_agree",
          "b1_i_dont_think_so",
          "b1_agree_disagree_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_agree_disagree_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_i_agree"
      },
      {
        "type": "free_reply",
        "evalKind": "agree_or_disagree",
        "itemIds": [
          "b1_i_agree",
          "b1_agree_disagree_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "agree_or_disagree",
        "itemIds": [
          "b1_i_dont_think_so",
          "b1_youre_right",
          "b1_i_see_what_you_mean"
        ]
      }
    ]
  },
  {
    "id": "having_a_real_exchange",
    "level": "B1",
    "arc": "i_think_that",
    "titleKey": "b1Ep6Title",
    "goalKey": "b1Ep6Goal",
    "canDoId": "agree_or_disagree",
    "canDoNameKey": "b1Ep6CanDoName",
    "durationKey": "b1Ep6Duration",
    "estimatedMinutes": 8,
    "xp": 90,
    "prerequisites": [
      "what_i_think",
      "agree_to_disagree"
    ],
    "reinforces": true,
    "skillPrerequisites": [
      "express_an_opinion_with_a_reason"
    ],
    "role": "reinforcement",
    "reuseSkills": [
      "give_an_opinion",
      "agree_or_disagree"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "state_opinion",
        "itemIds": [
          "b1_opinion_frame_pattern",
          "b1_because_reason_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_agree_disagree_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "agree_or_disagree",
        "itemIds": [
          "b1_i_agree",
          "b1_i_dont_think_so"
        ]
      }
    ]
  },
  {
    "id": "more_than_two",
    "level": "B1",
    "arc": "which_one",
    "titleKey": "b1Ep7Title",
    "goalKey": "b1Ep7Goal",
    "canDoId": "compare_options_with_reasons",
    "canDoNameKey": "b1Ep7CanDoName",
    "durationKey": "b1Ep7Duration",
    "estimatedMinutes": 9,
    "xp": 85,
    "gardenItems": [
      "b1_more_than",
      "b1_less_than",
      "b1_the_most",
      "b1_of_the_three",
      "b1_comparative_superlative_pattern",
      "b1_multi_attribute_compare_pattern"
    ],
    "skillPrerequisites": [
      "compare_two_things"
    ],
    "role": "primary",
    "reuseSkills": [
      "compare_two_things"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_more_than",
          "b1_the_most",
          "b1_of_the_three",
          "b1_comparative_superlative_pattern",
          "b1_multi_attribute_compare_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_comparative_superlative_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_comparative_superlative_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "compare_and_choose",
        "itemIds": [
          "b1_more_than",
          "b1_the_most",
          "b1_of_the_three",
          "b1_comparative_superlative_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "compare_and_choose",
        "itemIds": [
          "b1_less_than",
          "b1_multi_attribute_compare_pattern"
        ]
      }
    ]
  },
  {
    "id": "the_trip_i_took",
    "level": "B1",
    "arc": "which_one",
    "titleKey": "b1Ep8Title",
    "goalKey": "b1Ep8Goal",
    "canDoId": "describe_an_experience",
    "canDoNameKey": "b1Ep8CanDoName",
    "durationKey": "b1Ep8Duration",
    "estimatedMinutes": 10,
    "xp": 90,
    "gardenItems": [
      "b1_multi_attribute_description_pattern",
      "b1_feeling_reaction_pattern",
      "b1_it_made_me_feel",
      "b1_i_felt",
      "b1_peaceful",
      "b1_exhausting",
      "b1_unforgettable"
    ],
    "skillPrerequisites": [
      "describe_a_person_or_place"
    ],
    "role": "primary",
    "reuseSkills": [
      "describe_a_person_or_place"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_multi_attribute_description_pattern",
          "b1_feeling_reaction_pattern",
          "b1_it_made_me_feel",
          "b1_peaceful"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_multi_attribute_description_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_it_made_me_feel"
      },
      {
        "type": "free_reply",
        "evalKind": "describe_experience",
        "itemIds": [
          "b1_multi_attribute_description_pattern",
          "b1_feeling_reaction_pattern",
          "b1_i_felt"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "describe_experience",
        "itemIds": [
          "b1_exhausting",
          "b1_unforgettable"
        ]
      }
    ]
  },
  {
    "id": "id_recommend",
    "level": "B1",
    "arc": "which_one",
    "titleKey": "b1Ep9Title",
    "goalKey": "b1Ep9Goal",
    "canDoId": "recommend_or_warn",
    "canDoNameKey": "b1Ep9CanDoName",
    "durationKey": "b1Ep9Duration",
    "estimatedMinutes": 8,
    "xp": 85,
    "prerequisites": [
      "more_than_two",
      "the_trip_i_took"
    ],
    "gardenItems": [
      "b1_id_recommend",
      "b1_i_wouldnt_recommend",
      "b1_recommend_warn_pattern",
      "b1_id_avoid"
    ],
    "role": "primary",
    "reuseSkills": [
      "compare_options_with_reasons",
      "describe_an_experience"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_id_recommend",
          "b1_i_wouldnt_recommend",
          "b1_recommend_warn_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_recommend_warn_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_i_wouldnt_recommend"
      },
      {
        "type": "free_reply",
        "evalKind": "recommend_or_warn",
        "itemIds": [
          "b1_id_recommend",
          "b1_recommend_warn_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "recommend_or_warn",
        "itemIds": [
          "b1_i_wouldnt_recommend",
          "b1_id_avoid"
        ]
      }
    ]
  },
  {
    "id": "the_perfect_trip",
    "level": "B1",
    "arc": "which_one",
    "titleKey": "b1Ep10Title",
    "goalKey": "b1Ep10Goal",
    "canDoId": "recommend_or_warn",
    "canDoNameKey": "b1Ep10CanDoName",
    "durationKey": "b1Ep10Duration",
    "estimatedMinutes": 9,
    "xp": 95,
    "prerequisites": [
      "more_than_two",
      "the_trip_i_took",
      "id_recommend"
    ],
    "reinforces": true,
    "role": "reinforcement",
    "reuseSkills": [
      "compare_options_with_reasons",
      "describe_an_experience",
      "recommend_or_warn"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "compare_and_choose",
        "itemIds": [
          "b1_the_most",
          "b1_multi_attribute_compare_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "describe_experience",
        "itemIds": [
          "b1_multi_attribute_description_pattern",
          "b1_feeling_reaction_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_recommend_warn_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "recommend_or_warn",
        "itemIds": [
          "b1_id_recommend",
          "b1_i_wouldnt_recommend"
        ]
      }
    ]
  },
  {
    "id": "somethings_not_right",
    "level": "B1",
    "arc": "somethings_wrong",
    "titleKey": "b1Ep11Title",
    "goalKey": "b1Ep11Goal",
    "canDoId": "escalate_and_resolve_a_problem",
    "canDoNameKey": "b1Ep11CanDoName",
    "durationKey": "b1Ep11Duration",
    "estimatedMinutes": 9,
    "xp": 85,
    "gardenItems": [
      "b1_theres_a_problem_with",
      "b1_i_ordered_but_i_got",
      "b1_problem_statement_pattern",
      "b1_its_supposed_to",
      "b1_instead_of",
      "b1_broken"
    ],
    "skillPrerequisites": [
      "report_a_problem"
    ],
    "role": "primary",
    "reuseSkills": [
      "report_a_problem"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_theres_a_problem_with",
          "b1_i_ordered_but_i_got",
          "b1_problem_statement_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_problem_statement_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_theres_a_problem_with"
      },
      {
        "type": "free_reply",
        "evalKind": "escalate_problem",
        "itemIds": [
          "b1_theres_a_problem_with",
          "b1_i_ordered_but_i_got",
          "b1_problem_statement_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "escalate_problem",
        "itemIds": [
          "b1_its_supposed_to",
          "b1_instead_of",
          "b1_broken"
        ]
      }
    ]
  },
  {
    "id": "lets_sort_this_out",
    "level": "B1",
    "arc": "somethings_wrong",
    "titleKey": "b1Ep12Title",
    "goalKey": "b1Ep12Goal",
    "canDoId": "negotiate_a_solution",
    "canDoNameKey": "b1Ep12CanDoName",
    "durationKey": "b1Ep12Duration",
    "estimatedMinutes": 9,
    "xp": 90,
    "prerequisites": [
      "somethings_not_right"
    ],
    "gardenItems": [
      "b1_would_it_be_possible",
      "b1_could_i_possibly",
      "b1_negotiate_pattern",
      "b1_instead",
      "b1_a_replacement",
      "b1_a_refund"
    ],
    "skillPrerequisites": [
      "polite_request"
    ],
    "role": "primary",
    "reuseSkills": [
      "escalate_and_resolve_a_problem"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_would_it_be_possible",
          "b1_could_i_possibly",
          "b1_negotiate_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_negotiate_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_would_it_be_possible"
      },
      {
        "type": "free_reply",
        "evalKind": "negotiate_solution",
        "itemIds": [
          "b1_would_it_be_possible",
          "b1_negotiate_pattern",
          "b1_a_replacement"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "negotiate_solution",
        "itemIds": [
          "b1_could_i_possibly",
          "b1_instead",
          "b1_a_refund"
        ]
      }
    ]
  },
  {
    "id": "staying_calm",
    "level": "B1",
    "arc": "somethings_wrong",
    "titleKey": "b1Ep13Title",
    "goalKey": "b1Ep13Goal",
    "canDoId": "express_frustration_politely",
    "canDoNameKey": "b1Ep13CanDoName",
    "durationKey": "b1Ep13Duration",
    "estimatedMinutes": 7,
    "xp": 80,
    "prerequisites": [
      "somethings_not_right"
    ],
    "gardenItems": [
      "b1_this_isnt_ideal",
      "b1_i_understand_but",
      "b1_polite_frustration_pattern"
    ],
    "role": "primary",
    "reuseSkills": [
      "escalate_and_resolve_a_problem"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_this_isnt_ideal",
          "b1_i_understand_but",
          "b1_polite_frustration_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_polite_frustration_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_this_isnt_ideal"
      },
      {
        "type": "free_reply",
        "evalKind": "escalate_problem",
        "itemIds": [
          "b1_this_isnt_ideal",
          "b1_polite_frustration_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "escalate_problem",
        "itemIds": [
          "b1_i_understand_but"
        ]
      }
    ]
  },
  {
    "id": "problem_solved",
    "level": "B1",
    "arc": "somethings_wrong",
    "titleKey": "b1Ep14Title",
    "goalKey": "b1Ep14Goal",
    "canDoId": "negotiate_a_solution",
    "canDoNameKey": "b1Ep14CanDoName",
    "durationKey": "b1Ep14Duration",
    "estimatedMinutes": 10,
    "xp": 100,
    "prerequisites": [
      "somethings_not_right",
      "lets_sort_this_out"
    ],
    "reinforces": true,
    "role": "reinforcement",
    "reuseSkills": [
      "escalate_and_resolve_a_problem",
      "negotiate_a_solution",
      "express_frustration_politely"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_theres_a_problem_with",
          "b1_would_it_be_possible",
          "b1_this_isnt_ideal"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "escalate_problem",
        "itemIds": [
          "b1_theres_a_problem_with",
          "b1_problem_statement_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_negotiate_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "negotiate_solution",
        "itemIds": [
          "b1_negotiate_pattern",
          "b1_a_replacement",
          "b1_a_refund"
        ]
      }
    ]
  },
  {
    "id": "whats_the_plan",
    "level": "B1",
    "arc": "looking_ahead",
    "titleKey": "b1Ep15Title",
    "goalKey": "b1Ep15Goal",
    "canDoId": "talk_about_plans_and_intentions",
    "canDoNameKey": "b1Ep15CanDoName",
    "durationKey": "b1Ep15Duration",
    "estimatedMinutes": 10,
    "xp": 90,
    "gardenItems": [
      "b1_ill",
      "b1_im_going_to",
      "b1_will_vs_going_to_pattern",
      "b1_probably",
      "b1_definitely"
    ],
    "skillPrerequisites": [
      "talk_about_future_plans"
    ],
    "role": "primary",
    "reuseSkills": [
      "talk_about_future_plans"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_ill",
          "b1_im_going_to",
          "b1_will_vs_going_to_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_will_vs_going_to_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_ill"
      },
      {
        "type": "free_reply",
        "evalKind": "state_future_intent",
        "itemIds": [
          "b1_ill",
          "b1_will_vs_going_to_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_future_intent",
        "itemIds": [
          "b1_im_going_to",
          "b1_will_vs_going_to_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_future_intent",
        "itemIds": [
          "b1_probably",
          "b1_definitely"
        ]
      }
    ]
  },
  {
    "id": "someday",
    "level": "B1",
    "arc": "looking_ahead",
    "titleKey": "b1Ep16Title",
    "goalKey": "b1Ep16Goal",
    "canDoId": "talk_about_hopes_and_ambitions",
    "canDoNameKey": "b1Ep16CanDoName",
    "durationKey": "b1Ep16Duration",
    "estimatedMinutes": 8,
    "xp": 85,
    "prerequisites": [
      "whats_the_plan"
    ],
    "gardenItems": [
      "b1_i_hope_to",
      "b1_id_like_to",
      "b1_one_day_ill",
      "b1_hope_would_like_pattern",
      "b1_my_dream_is_to"
    ],
    "role": "primary",
    "reuseSkills": [
      "talk_about_plans_and_intentions"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_i_hope_to",
          "b1_one_day_ill",
          "b1_hope_would_like_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_hope_would_like_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_i_hope_to"
      },
      {
        "type": "free_reply",
        "evalKind": "state_future_intent",
        "itemIds": [
          "b1_i_hope_to",
          "b1_hope_would_like_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_future_intent",
        "itemIds": [
          "b1_id_like_to",
          "b1_my_dream_is_to"
        ]
      }
    ]
  },
  {
    "id": "if_that_happens",
    "level": "B1",
    "arc": "looking_ahead",
    "titleKey": "b1Ep17Title",
    "goalKey": "b1Ep17Goal",
    "canDoId": "talk_about_real_conditions",
    "canDoNameKey": "b1Ep17CanDoName",
    "durationKey": "b1Ep17Duration",
    "estimatedMinutes": 7,
    "xp": 80,
    "prerequisites": [
      "whats_the_plan"
    ],
    "gardenItems": [
      "b1_if_present_will",
      "b1_first_conditional_pattern",
      "b1_unless",
      "b1_as_soon_as"
    ],
    "role": "primary",
    "reuseSkills": [
      "talk_about_plans_and_intentions"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_if_present_will",
          "b1_first_conditional_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_first_conditional_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_if_present_will"
      },
      {
        "type": "free_reply",
        "evalKind": "state_real_condition",
        "itemIds": [
          "b1_first_conditional_pattern",
          "b1_unless"
        ]
      }
    ]
  },
  {
    "id": "if_i_were_you",
    "level": "B1",
    "arc": "looking_ahead",
    "titleKey": "b1Ep18Title",
    "goalKey": "b1Ep18Goal",
    "canDoId": "imagine_a_hypothetical",
    "canDoNameKey": "b1Ep18CanDoName",
    "durationKey": "b1Ep18Duration",
    "estimatedMinutes": 7,
    "xp": 75,
    "prerequisites": [
      "if_that_happens"
    ],
    "gardenItems": [
      "b1_if_i_were_you",
      "b1_if_i_were_pattern",
      "b1_id_verb",
      "b1_in_your_position"
    ],
    "role": "primary",
    "reuseSkills": [
      "talk_about_real_conditions"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_if_i_were_you",
          "b1_if_i_were_pattern",
          "b1_id_verb"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_if_i_were_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_if_i_were_you"
      },
      {
        "type": "free_reply",
        "evalKind": "state_hypothetical",
        "itemIds": [
          "b1_if_i_were_you",
          "b1_if_i_were_pattern",
          "b1_id_verb"
        ],
        "placeholders": [
          "name"
        ]
      }
    ]
  },
  {
    "id": "changing_the_subject",
    "level": "B1",
    "arc": "keep_talking",
    "titleKey": "b1Ep19Title",
    "goalKey": "b1Ep19Goal",
    "canDoId": "sustain_topic_change",
    "canDoNameKey": "b1Ep19CanDoName",
    "durationKey": "b1Ep19Duration",
    "estimatedMinutes": 9,
    "xp": 90,
    "gardenItems": [
      "b1_by_the_way",
      "b1_anyway",
      "b1_speaking_of",
      "b1_topic_change_pattern"
    ],
    "skillPrerequisites": [
      "keep_a_longer_conversation_going"
    ],
    "role": "primary",
    "reuseSkills": [
      "keep_a_longer_conversation_going"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_anyway",
          "b1_by_the_way",
          "b1_topic_change_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_topic_change_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_anyway"
      },
      {
        "type": "free_reply",
        "evalKind": "change_topic",
        "itemIds": [
          "b1_by_the_way",
          "b1_anyway",
          "b1_speaking_of",
          "b1_topic_change_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "change_topic",
        "itemIds": [
          "b1_speaking_of"
        ],
        "placeholders": [
          "name"
        ]
      }
    ]
  },
  {
    "id": "tell_me_more",
    "level": "B1",
    "arc": "keep_talking",
    "titleKey": "b1Ep20Title",
    "goalKey": "b1Ep20Goal",
    "canDoId": "ask_follow_up_questions",
    "canDoNameKey": "b1Ep20CanDoName",
    "durationKey": "b1Ep20Duration",
    "estimatedMinutes": 8,
    "xp": 85,
    "prerequisites": [
      "changing_the_subject"
    ],
    "gardenItems": [
      "b1_really",
      "b1_why",
      "b1_what_happened",
      "b1_follow_up_question_pattern"
    ],
    "role": "primary",
    "reuseSkills": [
      "sustain_topic_change"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_really",
          "b1_what_happened",
          "b1_follow_up_question_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_follow_up_question_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_really"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_follow_up",
        "itemIds": [
          "b1_really",
          "b1_why",
          "b1_follow_up_question_pattern"
        ],
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "ask_follow_up",
        "itemIds": [
          "b1_what_happened"
        ]
      }
    ]
  },
  {
    "id": "so_basically",
    "level": "B1",
    "arc": "keep_talking",
    "titleKey": "b1Ep21Title",
    "goalKey": "b1Ep21Goal",
    "canDoId": "summarize_what_was_said",
    "canDoNameKey": "b1Ep21CanDoName",
    "durationKey": "b1Ep21Duration",
    "estimatedMinutes": 7,
    "xp": 80,
    "prerequisites": [
      "tell_me_more"
    ],
    "gardenItems": [
      "b1_so_basically",
      "b1_what_youre_saying_is",
      "b1_summarize_pattern",
      "b1_in_other_words"
    ],
    "role": "primary",
    "reuseSkills": [
      "ask_follow_up_questions"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "b1_so_basically",
          "b1_what_youre_saying_is",
          "b1_summarize_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "b1_summarize_pattern"
      },
      {
        "type": "fill_blank",
        "itemId": "b1_so_basically"
      },
      {
        "type": "free_reply",
        "evalKind": "summarize_other",
        "itemIds": [
          "b1_so_basically",
          "b1_what_youre_saying_is",
          "b1_summarize_pattern",
          "b1_in_other_words"
        ],
        "placeholders": [
          "name"
        ]
      }
    ]
  },
  {
    "id": "the_long_conversation_begins",
    "level": "B1",
    "arc": "the_long_conversation",
    "titleKey": "b1Ep22Title",
    "goalKey": "b1Ep22Goal",
    "canDoId": "narrate_connected_event",
    "canDoNameKey": "b1Ep22CanDoName",
    "durationKey": "b1Ep22Duration",
    "estimatedMinutes": 14,
    "xp": 120,
    "prerequisites": [
      "one_thing_after_another",
      "when_it_happened",
      "what_i_think",
      "agree_to_disagree",
      "changing_the_subject",
      "tell_me_more"
    ],
    "reinforces": true,
    "role": "reinforcement",
    "reuseSkills": [
      "narrate_connected_event",
      "narrate_interrupted_action",
      "give_an_opinion",
      "agree_or_disagree",
      "sustain_topic_change",
      "ask_follow_up_questions"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "narrate_past_event",
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "narrate_past_event"
      },
      {
        "type": "free_reply",
        "evalKind": "change_topic",
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_opinion"
      },
      {
        "type": "free_reply",
        "evalKind": "agree_or_disagree"
      },
      {
        "type": "free_reply",
        "evalKind": "ask_follow_up"
      }
    ]
  },
  {
    "id": "the_long_conversation_continues",
    "level": "B1",
    "arc": "the_long_conversation",
    "titleKey": "b1Ep23Title",
    "goalKey": "b1Ep23Goal",
    "canDoId": "negotiate_a_solution",
    "canDoNameKey": "b1Ep23CanDoName",
    "durationKey": "b1Ep23Duration",
    "estimatedMinutes": 14,
    "xp": 130,
    "prerequisites": [
      "more_than_two",
      "the_trip_i_took",
      "whats_the_plan",
      "someday",
      "somethings_not_right",
      "lets_sort_this_out"
    ],
    "reinforces": true,
    "role": "reinforcement",
    "reuseSkills": [
      "compare_options_with_reasons",
      "describe_an_experience",
      "talk_about_plans_and_intentions",
      "talk_about_hopes_and_ambitions",
      "escalate_and_resolve_a_problem",
      "negotiate_a_solution",
      "recommend_or_warn",
      "summarize_what_was_said"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "compare_and_choose"
      },
      {
        "type": "free_reply",
        "evalKind": "describe_experience"
      },
      {
        "type": "free_reply",
        "evalKind": "recommend_or_warn"
      },
      {
        "type": "free_reply",
        "evalKind": "state_future_intent"
      },
      {
        "type": "free_reply",
        "evalKind": "state_future_intent"
      },
      {
        "type": "free_reply",
        "evalKind": "escalate_problem",
        "placeholders": [
          "name"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "negotiate_solution"
      },
      {
        "type": "free_reply",
        "evalKind": "summarize_other"
      }
    ]
  },
  {
    "id": "b2_making_the_case_opinions",
    "level": "B2",
    "arc": "making_the_case",
    "titleKey": "b2ep1Title",
    "goalKey": "b2ep1Goal",
    "canDoId": "develop_and_defend_opinion",
    "canDoNameKey": "b2ep1CanDoName",
    "durationKey": "b2ep1Duration",
    "estimatedMinutes": 10,
    "xp": 90,
    "gardenItems": [
      "opinion_stance_pattern",
      "id_say",
      "the_way_i_see_it",
      "to_be_honest",
      "the_thing_is"
    ],
    "skillPrerequisites": [
      "b1.give_an_opinion"
    ],
    "role": "primary",
    "reuseSkills": [
      "b1.give_an_opinion"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "opinion_stance_pattern",
          "the_way_i_see_it"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "opinion_stance_pattern"
      },
      {
        "type": "choice",
        "itemId": "opinion_stance_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "argue_opinion_with_reason",
        "itemIds": [
          "opinion_stance_pattern",
          "the_way_i_see_it"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "argue_opinion_with_reason",
        "itemIds": [
          "opinion_stance_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "argue_opinion_with_reason",
        "itemIds": [
          "opinion_stance_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_making_the_case_tradeoffs",
    "level": "B2",
    "arc": "making_the_case",
    "titleKey": "b2ep2Title",
    "goalKey": "b2ep2Goal",
    "canDoId": "weigh_advantages_and_disadvantages",
    "canDoNameKey": "b2ep2CanDoName",
    "durationKey": "b2ep2Duration",
    "estimatedMinutes": 10,
    "xp": 90,
    "prerequisites": [
      "b2_making_the_case_opinions"
    ],
    "gardenItems": [
      "contrast_connector_pattern",
      "advantage_disadvantage_frame",
      "when_it_comes_to",
      "on_balance",
      "all_things_considered",
      "the_bottom_line_is"
    ],
    "skillPrerequisites": [
      "b1.compare_options_with_reasons",
      "develop_and_defend_opinion"
    ],
    "role": "primary",
    "reuseSkills": [
      "develop_and_defend_opinion"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "argue_opinion_with_reason",
        "itemIds": [
          "opinion_stance_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "contrast_connector_pattern",
          "advantage_disadvantage_frame"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "contrast_connector_pattern"
      },
      {
        "type": "word_order",
        "itemId": "advantage_disadvantage_frame"
      },
      {
        "type": "free_reply",
        "evalKind": "weigh_options",
        "itemIds": [
          "contrast_connector_pattern",
          "advantage_disadvantage_frame"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "weigh_options",
        "itemIds": [
          "contrast_connector_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "weigh_options",
        "itemIds": [
          "advantage_disadvantage_frame"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_making_the_case_concede",
    "level": "B2",
    "arc": "making_the_case",
    "titleKey": "b2ep3Title",
    "goalKey": "b2ep3Goal",
    "canDoId": "concede_a_point_and_counter",
    "canDoNameKey": "b2ep3CanDoName",
    "durationKey": "b2ep3Duration",
    "estimatedMinutes": 8,
    "xp": 75,
    "prerequisites": [
      "b2_making_the_case_tradeoffs"
    ],
    "gardenItems": [
      "concession_counter_pattern",
      "a_fair_point",
      "a_valid_point",
      "im_not_convinced_that"
    ],
    "skillPrerequisites": [
      "develop_and_defend_opinion"
    ],
    "role": "secondary",
    "reuseSkills": [
      "develop_and_defend_opinion",
      "weigh_advantages_and_disadvantages"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "weigh_options",
        "itemIds": [
          "contrast_connector_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "concession_counter_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "concession_counter_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "concede_and_counter",
        "itemIds": [
          "concession_counter_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "concede_and_counter",
        "itemIds": [
          "concession_counter_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_making_the_case_integrated",
    "level": "B2",
    "arc": "making_the_case",
    "titleKey": "b2ep4Title",
    "goalKey": "b2ep4Goal",
    "canDoId": "develop_and_defend_opinion",
    "canDoNameKey": "b2ep4CanDoName",
    "durationKey": "b2ep4Duration",
    "estimatedMinutes": 12,
    "xp": 110,
    "prerequisites": [
      "b2_making_the_case_concede"
    ],
    "skillPrerequisites": [
      "develop_and_defend_opinion",
      "weigh_advantages_and_disadvantages",
      "concede_a_point_and_counter"
    ],
    "role": "integrated",
    "reuseSkills": [
      "develop_and_defend_opinion",
      "weigh_advantages_and_disadvantages",
      "concede_a_point_and_counter"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "argue_opinion_with_reason",
        "itemIds": [
          "opinion_stance_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "concede_and_counter",
        "itemIds": [
          "concession_counter_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "weigh_options",
        "itemIds": [
          "contrast_connector_pattern",
          "advantage_disadvantage_frame"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "argue_opinion_with_reason",
        "itemIds": [
          "opinion_stance_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "weigh_options",
        "itemIds": [
          "advantage_disadvantage_frame"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_when_plans_go_wrong_justify",
    "level": "B2",
    "arc": "when_plans_go_wrong",
    "titleKey": "b2ep5Title",
    "goalKey": "b2ep5Goal",
    "canDoId": "justify_a_request_for_change",
    "canDoNameKey": "b2ep5CanDoName",
    "durationKey": "b2ep5Duration",
    "estimatedMinutes": 10,
    "xp": 90,
    "prerequisites": [
      "b2_making_the_case_integrated"
    ],
    "gardenItems": [
      "justification_pattern",
      "the_issue_is_that",
      "could_you_look_into",
      "id_appreciate_it_if",
      "at_your_earliest_convenience"
    ],
    "skillPrerequisites": [
      "b1.give_an_opinion",
      "develop_and_defend_opinion"
    ],
    "role": "primary",
    "reuseSkills": [
      "develop_and_defend_opinion"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "argue_opinion_with_reason",
        "itemIds": [
          "opinion_stance_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "justification_pattern",
          "the_issue_is_that"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "justification_pattern"
      },
      {
        "type": "choice",
        "itemId": "justification_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "justify_a_request",
        "itemIds": [
          "justification_pattern",
          "the_issue_is_that"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "justify_a_request",
        "itemIds": [
          "justification_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "justify_a_request",
        "itemIds": [
          "justification_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_when_plans_go_wrong_negotiate",
    "level": "B2",
    "arc": "when_plans_go_wrong",
    "titleKey": "b2ep6Title",
    "goalKey": "b2ep6Goal",
    "canDoId": "negotiate_a_resolution",
    "canDoNameKey": "b2ep6CanDoName",
    "durationKey": "b2ep6Duration",
    "estimatedMinutes": 10,
    "xp": 90,
    "prerequisites": [
      "b2_when_plans_go_wrong_justify"
    ],
    "gardenItems": [
      "negotiation_proposal_pattern",
      "what_id_like_is",
      "would_it_be_possible_to",
      "i_was_wondering_if_you_could",
      "as_a_gesture_of_goodwill",
      "in_that_case",
      "lets_see_what_we_can_do"
    ],
    "skillPrerequisites": [
      "b1.negotiate_a_solution",
      "justify_a_request_for_change"
    ],
    "role": "primary",
    "reuseSkills": [
      "justify_a_request_for_change"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "justify_a_request",
        "itemIds": [
          "justification_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "negotiation_proposal_pattern",
          "what_id_like_is"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "negotiation_proposal_pattern"
      },
      {
        "type": "word_order",
        "itemId": "negotiation_proposal_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern",
          "what_id_like_is"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_when_plans_go_wrong_diplomatic",
    "level": "B2",
    "arc": "when_plans_go_wrong",
    "titleKey": "b2ep7Title",
    "goalKey": "b2ep7Goal",
    "canDoId": "express_frustration_diplomatically",
    "canDoNameKey": "b2ep7CanDoName",
    "durationKey": "b2ep7Duration",
    "estimatedMinutes": 8,
    "xp": 75,
    "prerequisites": [
      "b2_when_plans_go_wrong_negotiate"
    ],
    "gardenItems": [
      "diplomatic_hedge_pattern",
      "thats_not_really_acceptable",
      "i_understand_but",
      "to_be_fair",
      "i_take_your_point"
    ],
    "skillPrerequisites": [
      "justify_a_request_for_change"
    ],
    "role": "secondary",
    "reuseSkills": [
      "justify_a_request_for_change",
      "negotiate_a_resolution"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "diplomatic_hedge_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "diplomatic_hedge_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "express_diplomatic_frustration",
        "itemIds": [
          "diplomatic_hedge_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "express_diplomatic_frustration",
        "itemIds": [
          "diplomatic_hedge_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_when_plans_go_wrong_integrated",
    "level": "B2",
    "arc": "when_plans_go_wrong",
    "titleKey": "b2ep8Title",
    "goalKey": "b2ep8Goal",
    "canDoId": "justify_a_request_for_change",
    "canDoNameKey": "b2ep8CanDoName",
    "durationKey": "b2ep8Duration",
    "estimatedMinutes": 12,
    "xp": 110,
    "prerequisites": [
      "b2_when_plans_go_wrong_diplomatic"
    ],
    "skillPrerequisites": [
      "justify_a_request_for_change",
      "negotiate_a_resolution",
      "express_frustration_diplomatically"
    ],
    "role": "integrated",
    "reuseSkills": [
      "justify_a_request_for_change",
      "negotiate_a_resolution",
      "express_frustration_diplomatically",
      "develop_and_defend_opinion",
      "concede_a_point_and_counter"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "justify_a_request",
        "itemIds": [
          "justification_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "concede_and_counter",
        "itemIds": [
          "concession_counter_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "express_diplomatic_frustration",
        "itemIds": [
          "diplomatic_hedge_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_what_if_hypothesize",
    "level": "B2",
    "arc": "what_if",
    "titleKey": "b2ep9Title",
    "goalKey": "b2ep9Goal",
    "canDoId": "hypothesize_about_unreal_situations",
    "canDoNameKey": "b2ep9CanDoName",
    "durationKey": "b2ep9Duration",
    "estimatedMinutes": 10,
    "xp": 90,
    "gardenItems": [
      "second_conditional_pattern",
      "third_conditional_pattern",
      "mixed_conditional_pattern",
      "what_would_you_do_if"
    ],
    "skillPrerequisites": [
      "b1.talk_about_plans_and_intentions"
    ],
    "role": "primary",
    "reuseSkills": [
      "b1.talk_about_plans_and_intentions"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "second_conditional_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "second_conditional_pattern"
      },
      {
        "type": "choice",
        "itemId": "second_conditional_pattern"
      },
      {
        "type": "model",
        "meaningItems": [
          "third_conditional_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "third_conditional_pattern"
      },
      {
        "type": "model",
        "meaningItems": [
          "mixed_conditional_pattern"
        ]
      },
      {
        "type": "word_order",
        "itemId": "mixed_conditional_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "state_unreal_hypothesis",
        "itemIds": [
          "second_conditional_pattern",
          "what_would_you_do_if"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "state_unreal_hypothesis",
        "itemIds": [
          "third_conditional_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "state_unreal_hypothesis",
        "itemIds": [
          "second_conditional_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_what_if_speculate",
    "level": "B2",
    "arc": "what_if",
    "titleKey": "b2ep10Title",
    "goalKey": "b2ep10Goal",
    "canDoId": "speculate_about_cause_and_effect",
    "canDoNameKey": "b2ep10CanDoName",
    "durationKey": "b2ep10Duration",
    "estimatedMinutes": 10,
    "xp": 90,
    "prerequisites": [
      "b2_what_if_hypothesize"
    ],
    "gardenItems": [
      "modal_deduction_present_pattern",
      "modal_deduction_past_pattern",
      "i_bet",
      "chances_are",
      "theres_a_good_chance_that",
      "its_likely_that",
      "its_unlikely_that",
      "i_doubt_that",
      "i_have_a_feeling_that",
      "who_knows"
    ],
    "skillPrerequisites": [
      "hypothesize_about_unreal_situations"
    ],
    "role": "primary",
    "reuseSkills": [
      "hypothesize_about_unreal_situations"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "state_unreal_hypothesis",
        "itemIds": [
          "second_conditional_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "modal_deduction_present_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "modal_deduction_present_pattern"
      },
      {
        "type": "choice",
        "itemId": "modal_deduction_present_pattern"
      },
      {
        "type": "model",
        "meaningItems": [
          "modal_deduction_past_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "modal_deduction_past_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "speculate_cause_or_effect",
        "itemIds": [
          "modal_deduction_present_pattern",
          "i_bet"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "speculate_cause_or_effect",
        "itemIds": [
          "modal_deduction_past_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "speculate_cause_or_effect",
        "itemIds": [
          "modal_deduction_present_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_what_if_regret",
    "level": "B2",
    "arc": "what_if",
    "titleKey": "b2ep11Title",
    "goalKey": "b2ep11Goal",
    "canDoId": "express_regret_about_a_past_decision",
    "canDoNameKey": "b2ep11CanDoName",
    "durationKey": "b2ep11Duration",
    "estimatedMinutes": 8,
    "xp": 75,
    "prerequisites": [
      "b2_what_if_speculate"
    ],
    "gardenItems": [
      "wish_past_perfect_pattern"
    ],
    "skillPrerequisites": [
      "b1.narrate_connected_event",
      "hypothesize_about_unreal_situations"
    ],
    "role": "secondary",
    "reuseSkills": [
      "hypothesize_about_unreal_situations",
      "speculate_about_cause_and_effect"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "speculate_cause_or_effect",
        "itemIds": [
          "modal_deduction_present_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "wish_past_perfect_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "wish_past_perfect_pattern"
      },
      {
        "type": "choice",
        "itemId": "wish_past_perfect_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "express_past_regret",
        "itemIds": [
          "wish_past_perfect_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "express_past_regret",
        "itemIds": [
          "wish_past_perfect_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_what_if_integrated",
    "level": "B2",
    "arc": "what_if",
    "titleKey": "b2ep12Title",
    "goalKey": "b2ep12Goal",
    "canDoId": "hypothesize_about_unreal_situations",
    "canDoNameKey": "b2ep12CanDoName",
    "durationKey": "b2ep12Duration",
    "estimatedMinutes": 12,
    "xp": 110,
    "prerequisites": [
      "b2_what_if_regret"
    ],
    "skillPrerequisites": [
      "hypothesize_about_unreal_situations",
      "speculate_about_cause_and_effect",
      "express_regret_about_a_past_decision"
    ],
    "role": "integrated",
    "reuseSkills": [
      "hypothesize_about_unreal_situations",
      "speculate_about_cause_and_effect",
      "express_regret_about_a_past_decision"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "state_unreal_hypothesis",
        "itemIds": [
          "second_conditional_pattern",
          "third_conditional_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "speculate_cause_or_effect",
        "itemIds": [
          "modal_deduction_present_pattern",
          "modal_deduction_past_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "express_past_regret",
        "itemIds": [
          "wish_past_perfect_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "state_unreal_hypothesis",
        "itemIds": [
          "second_conditional_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "speculate_cause_or_effect",
        "itemIds": [
          "modal_deduction_past_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_talking_around_a_subject_summarize",
    "level": "B2",
    "arc": "talking_around_a_subject",
    "titleKey": "b2ep13Title",
    "goalKey": "b2ep13Goal",
    "canDoId": "summarize_for_someone_else",
    "canDoNameKey": "b2ep13CanDoName",
    "durationKey": "b2ep13Duration",
    "estimatedMinutes": 10,
    "xp": 90,
    "gardenItems": [
      "reported_speech_pattern",
      "summary_connector_pattern",
      "so_basically",
      "long_story_short",
      "the_gist_of_it_is",
      "to_sum_it_up"
    ],
    "skillPrerequisites": [
      "b1.narrate_connected_event",
      "b1.sustain_topic_change"
    ],
    "role": "primary",
    "reuseSkills": [
      "b1.narrate_connected_event",
      "b1.sustain_topic_change"
    ],
    "prerequisites": [],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "summary_connector_pattern",
          "reported_speech_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "reported_speech_pattern"
      },
      {
        "type": "choice",
        "itemId": "summary_connector_pattern"
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "summarize_for_third_party",
        "itemIds": [
          "reported_speech_pattern",
          "summary_connector_pattern"
        ]
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "summarize_for_third_party",
        "itemIds": [
          "summary_connector_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "summarize_for_third_party",
        "itemIds": [
          "reported_speech_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_talking_around_a_subject_reformulate",
    "level": "B2",
    "arc": "talking_around_a_subject",
    "titleKey": "b2ep14Title",
    "goalKey": "b2ep14Goal",
    "canDoId": "reformulate_to_clarify",
    "canDoNameKey": "b2ep14CanDoName",
    "durationKey": "b2ep14Duration",
    "estimatedMinutes": 10,
    "xp": 90,
    "prerequisites": [
      "b2_talking_around_a_subject_summarize"
    ],
    "gardenItems": [
      "reformulation_marker_pattern",
      "to_put_it_another_way",
      "if_i_understood_correctly",
      "let_me_break_it_down",
      "essentially",
      "just_to_clarify"
    ],
    "skillPrerequisites": [
      "summarize_for_someone_else"
    ],
    "role": "primary",
    "reuseSkills": [
      "summarize_for_someone_else"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "summarize_for_third_party",
        "itemIds": [
          "summary_connector_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "reformulation_marker_pattern"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "reformulation_marker_pattern"
      },
      {
        "type": "word_order",
        "itemId": "reformulation_marker_pattern"
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "reformulate_for_clarity",
        "itemIds": [
          "reformulation_marker_pattern"
        ]
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "reformulate_for_clarity",
        "itemIds": [
          "reformulation_marker_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "reformulate_for_clarity",
        "itemIds": [
          "reformulation_marker_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_talking_around_a_subject_report_opinion",
    "level": "B2",
    "arc": "talking_around_a_subject",
    "titleKey": "b2ep15Title",
    "goalKey": "b2ep15Goal",
    "canDoId": "report_someone_elses_opinion",
    "canDoNameKey": "b2ep15CanDoName",
    "durationKey": "b2ep15Duration",
    "estimatedMinutes": 8,
    "xp": 75,
    "prerequisites": [
      "b2_talking_around_a_subject_reformulate"
    ],
    "gardenItems": [
      "what_they_were_saying_was",
      "the_way_i_understood_it",
      "a_key_takeaway",
      "hearsay"
    ],
    "skillPrerequisites": [
      "summarize_for_someone_else",
      "b1.give_an_opinion"
    ],
    "role": "secondary",
    "reuseSkills": [
      "summarize_for_someone_else",
      "develop_and_defend_opinion"
    ],
    "steps": [
      {
        "type": "recall",
        "evalKind": "reformulate_for_clarity",
        "itemIds": [
          "reformulation_marker_pattern"
        ],
        "review": true
      },
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "reported_speech_pattern",
          "what_they_were_saying_was"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "reported_speech_pattern"
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "report_third_party_opinion",
        "itemIds": [
          "reported_speech_pattern"
        ]
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "report_third_party_opinion",
        "itemIds": [
          "reported_speech_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_talking_around_a_subject_integrated",
    "level": "B2",
    "arc": "talking_around_a_subject",
    "titleKey": "b2ep16Title",
    "goalKey": "b2ep16Goal",
    "canDoId": "summarize_for_someone_else",
    "canDoNameKey": "b2ep16CanDoName",
    "durationKey": "b2ep16Duration",
    "estimatedMinutes": 12,
    "xp": 110,
    "prerequisites": [
      "b2_talking_around_a_subject_report_opinion"
    ],
    "skillPrerequisites": [
      "summarize_for_someone_else",
      "reformulate_to_clarify",
      "report_someone_elses_opinion"
    ],
    "role": "integrated",
    "reuseSkills": [
      "summarize_for_someone_else",
      "reformulate_to_clarify",
      "report_someone_elses_opinion",
      "develop_and_defend_opinion"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "summarize_for_third_party",
        "itemIds": [
          "reported_speech_pattern",
          "summary_connector_pattern"
        ]
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "report_third_party_opinion",
        "itemIds": [
          "reported_speech_pattern"
        ]
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "reformulate_for_clarity",
        "itemIds": [
          "reformulation_marker_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "summarize_for_third_party",
        "itemIds": [
          "summary_connector_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "reformulate_for_clarity",
        "itemIds": [
          "reformulation_marker_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_reading_between_the_lines_register",
    "level": "B2",
    "arc": "reading_between_the_lines",
    "titleKey": "b2ep17Title",
    "goalKey": "b2ep17Goal",
    "canDoId": "adjust_register_to_context",
    "canDoNameKey": "b2ep17CanDoName",
    "durationKey": "b2ep17Duration",
    "estimatedMinutes": 11,
    "xp": 95,
    "prerequisites": [
      "b2_making_the_case_integrated"
    ],
    "gardenItems": [
      "register_marker_pattern",
      "if_you_dont_mind_me_asking",
      "would_you_mind",
      "with_all_due_respect",
      "just_between_us",
      "tactless",
      "blunt",
      "diplomatic_adj",
      "to_beat_around_the_bush",
      "to_get_straight_to_the_point"
    ],
    "skillPrerequisites": [
      "b1.sustain_topic_change"
    ],
    "role": "primary",
    "reuseSkills": [
      "b1.sustain_topic_change"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "scene",
        "itemId": "register_marker_pattern"
      },
      {
        "type": "scene",
        "itemId": "register_marker_pattern"
      },
      {
        "type": "choice",
        "itemId": "register_marker_pattern"
      },
      {
        "type": "choice",
        "itemId": "register_marker_pattern"
      },
      {
        "type": "model",
        "meaningItems": [
          "register_marker_pattern",
          "would_you_mind"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "register_marker_pattern"
      },
      {
        "type": "choice",
        "itemId": "register_marker_pattern"
      },
      {
        "type": "choice",
        "itemId": "register_marker_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "register_marker_pattern",
          "would_you_mind"
        ],
        "subtype": "formal_shift"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "register_marker_pattern"
        ],
        "subtype": "informal_shift"
      },
      {
        "type": "recall",
        "evalKind": "shift_register",
        "itemIds": [
          "register_marker_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_reading_between_the_lines_soften",
    "level": "B2",
    "arc": "reading_between_the_lines",
    "titleKey": "b2ep18Title",
    "goalKey": "b2ep18Goal",
    "canDoId": "soften_or_strengthen_a_statement",
    "canDoNameKey": "b2ep18CanDoName",
    "durationKey": "b2ep18Duration",
    "estimatedMinutes": 11,
    "xp": 95,
    "prerequisites": [
      "b2_reading_between_the_lines_register"
    ],
    "gardenItems": [
      "hedging_pattern",
      "intensifying_pattern",
      "i_hope_you_dont_mind_me_saying",
      "no_offense_but",
      "for_what_its_worth",
      "strictly_speaking",
      "if_im_honest",
      "an_understatement",
      "an_overstatement"
    ],
    "skillPrerequisites": [
      "adjust_register_to_context",
      "develop_and_defend_opinion"
    ],
    "role": "primary",
    "reuseSkills": [
      "adjust_register_to_context",
      "develop_and_defend_opinion"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "scene",
        "itemId": "hedging_pattern"
      },
      {
        "type": "scene",
        "itemId": "intensifying_pattern"
      },
      {
        "type": "choice",
        "itemId": "hedging_pattern"
      },
      {
        "type": "choice",
        "itemId": "intensifying_pattern"
      },
      {
        "type": "model",
        "meaningItems": [
          "hedging_pattern"
        ]
      },
      {
        "type": "fill_blank",
        "itemId": "hedging_pattern"
      },
      {
        "type": "comprehension",
        "itemId": "hedging_pattern"
      },
      {
        "type": "choice",
        "itemId": "hedging_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "soften_or_intensify_claim",
        "itemIds": [
          "hedging_pattern"
        ]
      },
      {
        "type": "free_reply",
        "evalKind": "soften_or_intensify_claim",
        "itemIds": [
          "intensifying_pattern"
        ]
      },
      {
        "type": "recall",
        "evalKind": "soften_or_intensify_claim",
        "itemIds": [
          "hedging_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_reading_between_the_lines_infer",
    "level": "B2",
    "arc": "reading_between_the_lines",
    "titleKey": "b2ep19Title",
    "goalKey": "b2ep19Goal",
    "canDoId": "infer_implied_meaning",
    "canDoNameKey": "b2ep19CanDoName",
    "durationKey": "b2ep19Duration",
    "estimatedMinutes": 8,
    "xp": 75,
    "prerequisites": [
      "b2_reading_between_the_lines_soften"
    ],
    "gardenItems": [
      "a_hint",
      "an_undertone",
      "a_backhanded_compliment",
      "to_read_between_the_lines",
      "condescending",
      "a_euphemism",
      "loaded_language",
      "passive_aggressive"
    ],
    "skillPrerequisites": [
      "adjust_register_to_context"
    ],
    "role": "secondary",
    "reuseSkills": [
      "adjust_register_to_context"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "model",
        "meaningItems": [
          "a_backhanded_compliment",
          "an_undertone"
        ]
      },
      {
        "type": "comprehension",
        "itemId": "a_euphemism"
      },
      {
        "type": "choice",
        "itemId": "passive_aggressive"
      },
      {
        "type": "choice",
        "itemId": "an_understatement"
      },
      {
        "type": "choice",
        "itemId": "condescending"
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_reading_between_the_lines_integrated",
    "level": "B2",
    "arc": "reading_between_the_lines",
    "titleKey": "b2ep20Title",
    "goalKey": "b2ep20Goal",
    "canDoId": "adjust_register_to_context",
    "canDoNameKey": "b2ep20CanDoName",
    "durationKey": "b2ep20Duration",
    "estimatedMinutes": 12,
    "xp": 110,
    "prerequisites": [
      "b2_reading_between_the_lines_infer"
    ],
    "skillPrerequisites": [
      "adjust_register_to_context",
      "soften_or_strengthen_a_statement",
      "infer_implied_meaning",
      "develop_and_defend_opinion"
    ],
    "role": "integrated",
    "reuseSkills": [
      "adjust_register_to_context",
      "soften_or_strengthen_a_statement",
      "infer_implied_meaning",
      "develop_and_defend_opinion"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "register_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "formal_shift"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "register_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "informal_shift"
      },
      {
        "type": "free_reply",
        "evalKind": "soften_or_intensify_claim",
        "itemIds": [
          "hedging_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "soften_or_intensify_claim",
        "itemIds": [
          "intensifying_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "choice",
        "itemId": "passive_aggressive"
      },
      {
        "type": "free_reply",
        "evalKind": "argue_opinion_with_reason",
        "itemIds": [
          "opinion_stance_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "recall",
        "evalKind": "shift_register",
        "itemIds": [
          "register_marker_pattern"
        ]
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_the_long_conversation_themed",
    "level": "B2",
    "arc": "the_long_conversation",
    "titleKey": "b2ep21Title",
    "goalKey": "b2ep21Goal",
    "canDoId": "sustain_a_multi_topic_conversation",
    "canDoNameKey": "b2ep21CanDoName",
    "durationKey": "b2ep21Duration",
    "estimatedMinutes": 22,
    "xp": 220,
    "prerequisites": [
      "b2_making_the_case_integrated"
    ],
    "gardenItems": [
      "topic_shift_marker_pattern",
      "before_we_move_on",
      "circling_back_to",
      "on_a_different_note",
      "that_being_said",
      "having_said_that",
      "lets_not_lose_sight_of",
      "where_were_we",
      "getting_back_to_what_you_said",
      "one_more_thing"
    ],
    "skillPrerequisites": [
      "develop_and_defend_opinion",
      "weigh_advantages_and_disadvantages",
      "concede_a_point_and_counter",
      "justify_a_request_for_change",
      "negotiate_a_resolution",
      "express_frustration_diplomatically",
      "hypothesize_about_unreal_situations",
      "speculate_about_cause_and_effect",
      "express_regret_about_a_past_decision",
      "summarize_for_someone_else",
      "reformulate_to_clarify",
      "report_someone_elses_opinion",
      "adjust_register_to_context",
      "soften_or_strengthen_a_statement",
      "infer_implied_meaning"
    ],
    "role": "capstone",
    "reuseSkills": [
      "b1.sustain_topic_change"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "argue_opinion_with_reason",
        "itemIds": [
          "opinion_stance_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "weigh_options",
        "itemIds": [
          "contrast_connector_pattern",
          "advantage_disadvantage_frame"
        ],
        "format": "roleplay"
      },
      {
        "type": "choice",
        "itemId": "concession_counter_pattern"
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "topic_shift_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "topic_shift"
      },
      {
        "type": "free_reply",
        "evalKind": "justify_a_request",
        "itemIds": [
          "justification_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "express_diplomatic_frustration",
        "itemIds": [
          "diplomatic_hedge_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "topic_shift_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "topic_shift"
      },
      {
        "type": "free_reply",
        "evalKind": "state_unreal_hypothesis",
        "itemIds": [
          "second_conditional_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "speculate_cause_or_effect",
        "itemIds": [
          "modal_deduction_present_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "express_past_regret",
        "itemIds": [
          "wish_past_perfect_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "summarize_for_third_party",
        "itemIds": [
          "summary_connector_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "reformulate_for_clarity",
        "itemIds": [
          "reformulation_marker_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "report_third_party_opinion",
        "itemIds": [
          "reported_speech_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "choice",
        "itemId": "register_marker_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "register_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "formal_shift"
      },
      {
        "type": "free_reply",
        "evalKind": "soften_or_intensify_claim",
        "itemIds": [
          "hedging_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "comprehension",
        "itemId": "to_meet_halfway"
      },
      {
        "type": "free_reply",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "concession_counter_pattern",
          "negotiation_proposal_pattern"
        ],
        "format": "roleplay",
        "subtype": "pushback"
      },
      {
        "type": "free_reply",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "diplomatic_hedge_pattern",
          "negotiation_proposal_pattern"
        ],
        "format": "roleplay",
        "subtype": "pushback"
      },
      {
        "type": "free_reply",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern"
        ],
        "format": "roleplay",
        "subtype": "pushback"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "topic_shift_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "topic_shift"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "topic_shift_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "topic_shift"
      },
      {
        "type": "recall",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern"
        ],
        "subtype": "pushback"
      },
      {
        "type": "completion"
      }
    ]
  },
  {
    "id": "b2_the_long_conversation_neutral",
    "level": "B2",
    "arc": "the_long_conversation",
    "titleKey": "b2ep21Title",
    "goalKey": "b2ep21Goal",
    "canDoId": "sustain_a_multi_topic_conversation",
    "canDoNameKey": "b2ep21CanDoName",
    "durationKey": "b2ep21Duration",
    "estimatedMinutes": 22,
    "xp": 220,
    "prerequisites": [
      "b2_making_the_case_integrated"
    ],
    "gardenItems": [
      "topic_shift_marker_pattern",
      "before_we_move_on",
      "circling_back_to",
      "on_a_different_note",
      "that_being_said",
      "having_said_that",
      "lets_not_lose_sight_of",
      "where_were_we",
      "getting_back_to_what_you_said",
      "one_more_thing"
    ],
    "skillPrerequisites": [
      "develop_and_defend_opinion",
      "weigh_advantages_and_disadvantages",
      "concede_a_point_and_counter",
      "justify_a_request_for_change",
      "negotiate_a_resolution",
      "express_frustration_diplomatically",
      "hypothesize_about_unreal_situations",
      "speculate_about_cause_and_effect",
      "express_regret_about_a_past_decision",
      "summarize_for_someone_else",
      "reformulate_to_clarify",
      "report_someone_elses_opinion",
      "adjust_register_to_context",
      "soften_or_strengthen_a_statement",
      "infer_implied_meaning"
    ],
    "role": "capstone",
    "reuseSkills": [
      "b1.sustain_topic_change"
    ],
    "steps": [
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "argue_opinion_with_reason",
        "itemIds": [
          "opinion_stance_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "weigh_options",
        "itemIds": [
          "contrast_connector_pattern",
          "advantage_disadvantage_frame"
        ],
        "format": "roleplay"
      },
      {
        "type": "choice",
        "itemId": "concession_counter_pattern"
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "topic_shift_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "topic_shift"
      },
      {
        "type": "free_reply",
        "evalKind": "justify_a_request",
        "itemIds": [
          "justification_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "express_diplomatic_frustration",
        "itemIds": [
          "diplomatic_hedge_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "topic_shift_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "topic_shift"
      },
      {
        "type": "free_reply",
        "evalKind": "state_unreal_hypothesis",
        "itemIds": [
          "second_conditional_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "speculate_cause_or_effect",
        "itemIds": [
          "modal_deduction_present_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "express_past_regret",
        "itemIds": [
          "wish_past_perfect_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "scene"
      },
      {
        "type": "free_reply",
        "evalKind": "summarize_for_third_party",
        "itemIds": [
          "summary_connector_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "reformulate_for_clarity",
        "itemIds": [
          "reformulation_marker_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "free_reply",
        "evalKind": "report_third_party_opinion",
        "itemIds": [
          "reported_speech_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "choice",
        "itemId": "register_marker_pattern"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "register_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "formal_shift"
      },
      {
        "type": "free_reply",
        "evalKind": "soften_or_intensify_claim",
        "itemIds": [
          "hedging_pattern"
        ],
        "format": "roleplay"
      },
      {
        "type": "comprehension",
        "itemId": "to_meet_halfway"
      },
      {
        "type": "free_reply",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "concession_counter_pattern",
          "negotiation_proposal_pattern"
        ],
        "format": "roleplay",
        "subtype": "pushback"
      },
      {
        "type": "free_reply",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "diplomatic_hedge_pattern",
          "negotiation_proposal_pattern"
        ],
        "format": "roleplay",
        "subtype": "pushback"
      },
      {
        "type": "free_reply",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern"
        ],
        "format": "roleplay",
        "subtype": "pushback"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "topic_shift_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "topic_shift"
      },
      {
        "type": "free_reply",
        "evalKind": "shift_register",
        "itemIds": [
          "topic_shift_marker_pattern"
        ],
        "format": "roleplay",
        "subtype": "topic_shift"
      },
      {
        "type": "recall",
        "evalKind": "propose_a_resolution",
        "itemIds": [
          "negotiation_proposal_pattern"
        ],
        "subtype": "pushback"
      },
      {
        "type": "completion"
      }
    ]
  }
]

export const SKELETON_BY_ID = Object.fromEntries(EPISODE_SKELETON.map(ep => [ep.id, ep]))
