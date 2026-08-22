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
  }
]

export const SKELETON_BY_ID = Object.fromEntries(EPISODE_SKELETON.map(ep => [ep.id, ep]))
