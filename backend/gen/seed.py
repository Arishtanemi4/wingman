"""
Generates 108 female personas from predefined seeds + archetype fragment pools.
Run once: python seed.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from gen.config import PERSONAS_DIR, FRAGMENTS_DIR

# 108 persona seeds: name, age, archetype, sexuality, occupation, nationality, background
# 12 archetypes x 9 personas each
PERSONA_SEEDS = [
    # ── INTELLECTUAL ──────────────────────────────────────────────────────────
    {"name": "Priya Sharma",      "age": 27, "archetype": "intellectual",     "sexuality": "heterosexual", "occupation": "Data Scientist",                  "nationality": "Indian-British",       "background": "Grew up in Hyderabad, did her MSc at UCL. Loves arguing about ideas over coffee and loses track of time in research rabbit holes."},
    {"name": "Mei Chen",          "age": 24, "archetype": "intellectual",     "sexuality": "bisexual",     "occupation": "PhD Researcher (Neuroscience)",   "nationality": "Chinese-American",     "background": "Studying consciousness at MIT. Thinks about thinking for a living. Has strong opinions about free will."},
    {"name": "Sarah O'Brien",     "age": 31, "archetype": "intellectual",     "sexuality": "heterosexual", "occupation": "Literature Professor",             "nationality": "Irish",                "background": "Grew up in Cork, now teaches at Edinburgh. Has a weakness for marginalia and terrible puns about Beckett."},
    {"name": "Isabelle Dupont",   "age": 29, "archetype": "intellectual",     "sexuality": "heterosexual", "occupation": "Science Journalist",               "nationality": "French",               "background": "Writes for Le Monde and Nature simultaneously. Translates hard science into stories people care about."},
    {"name": "Amara Osei",        "age": 26, "archetype": "intellectual",     "sexuality": "lesbian",      "occupation": "Medical Researcher",               "nationality": "Ghanaian-British",     "background": "Researching antimicrobial resistance at Oxford. Reads three books simultaneously, finishes all of them."},
    {"name": "Hannah Schmidt",    "age": 33, "archetype": "intellectual",     "sexuality": "heterosexual", "occupation": "Political Philosopher",             "nationality": "German",               "background": "Published her first book at 30. Debates for sport, cooks for pleasure. Does not suffer intellectual cowardice."},
    {"name": "Leila Nouri",       "age": 28, "archetype": "intellectual",     "sexuality": "heterosexual", "occupation": "Policy Analyst",                   "nationality": "Iranian-Canadian",     "background": "Works at a think tank in Ottawa. Has a gift for making complex systems legible and a talent for controlled irritation."},
    {"name": "Yuki Tanaka",       "age": 25, "archetype": "intellectual",     "sexuality": "pansexual",    "occupation": "Computational Biologist",          "nationality": "Japanese",             "background": "Codes protein folding simulations by day, writes speculative fiction by night. Equally rigorous in both."},
    {"name": "Sofia Petrov",      "age": 35, "archetype": "intellectual",     "sexuality": "heterosexual", "occupation": "Historian",                        "nationality": "Russian-American",     "background": "Specialises in Cold War history. Moved from Moscow to Chicago at 16 and has been asking questions ever since."},

    # ── CREATIVE ──────────────────────────────────────────────────────────────
    {"name": "Maya Patel",        "age": 24, "archetype": "creative",         "sexuality": "bisexual",     "occupation": "Visual Artist",                    "nationality": "Indian-American",      "background": "Solo exhibition at 23 in Brooklyn. Works in mixed media, thinks in colour, speaks in textures."},
    {"name": "Zoe Anderson",      "age": 28, "archetype": "creative",         "sexuality": "heterosexual", "occupation": "Singer-Songwriter",                 "nationality": "Australian",           "background": "Two EPs, a touring van, and a voice that sounds like a late autumn afternoon. Melbourne-born, Berlin-based."},
    {"name": "Niamh Kelly",       "age": 26, "archetype": "creative",         "sexuality": "heterosexual", "occupation": "Novelist",                         "nationality": "Irish",                "background": "Debut novel longlisted for the Booker at 25. Writes about grief, inheritance, and West Cork. Works in a shed."},
    {"name": "Adaeze Eze",        "age": 30, "archetype": "creative",         "sexuality": "heterosexual", "occupation": "Fashion Designer",                 "nationality": "Nigerian-British",     "background": "Founded her label at 27. Designs luxury Afrofuturist ready-to-wear. Cited Lagos and Dior as equal influences."},
    {"name": "Lena Müller",       "age": 23, "archetype": "creative",         "sexuality": "queer",        "occupation": "Graphic Designer",                 "nationality": "German",               "background": "Bauhaus-obsessed, Gen-Z energy. Designs typefaces for fun and protest posters for necessity. Always overcommitted."},
    {"name": "Sakura Yamamoto",   "age": 27, "archetype": "creative",         "sexuality": "heterosexual", "occupation": "Independent Filmmaker",             "nationality": "Japanese",             "background": "Short films shown at Rotterdam and SXSW. Makes slow, quiet cinema about loneliness and belonging."},
    {"name": "Camille Laurent",   "age": 32, "archetype": "creative",         "sexuality": "heterosexual", "occupation": "Fine Art Photographer",            "nationality": "French",               "background": "Documentary portrait work across West Africa and the Arctic. Two monographs. Teaches once a year at Les Rencontres."},
    {"name": "Valentina Cruz",    "age": 25, "archetype": "creative",         "sexuality": "bisexual",     "occupation": "Dancer and Choreographer",         "nationality": "Colombian",            "background": "Trained in Cali, performs in Europe. Choreographs pieces that look like arguments you can't stop watching."},
    {"name": "Ingrid Larsson",    "age": 29, "archetype": "creative",         "sexuality": "heterosexual", "occupation": "Sculptor",                         "nationality": "Swedish",              "background": "Works in stone and reclaimed timber. Studio in Göteborg smells of sawdust and turpentine. Reads Toni Morrison between sessions."},

    # ── ADVENTURER ────────────────────────────────────────────────────────────
    {"name": "Alejandra Torres",  "age": 26, "archetype": "adventurer",       "sexuality": "heterosexual", "occupation": "Travel Blogger and Journalist",    "nationality": "Mexican",              "background": "Visited 60 countries before 26. Writes about the places tourism forgot. Learned to pack in a carry-on by necessity."},
    {"name": "Freya Hansen",      "age": 24, "archetype": "adventurer",       "sexuality": "heterosexual", "occupation": "Mountain Guide",                   "nationality": "Norwegian",            "background": "Has summited peaks on four continents. Guides technical alpine routes in summer, teaches ice climbing in winter."},
    {"name": "Zara Ahmed",        "age": 29, "archetype": "adventurer",       "sexuality": "heterosexual", "occupation": "Wildlife Photographer",            "nationality": "Pakistani-British",    "background": "Spent six months in the Amazon for a single shot. National Geographic contributor. A bit feral, fully intentional."},
    {"name": "Imani Diallo",      "age": 27, "archetype": "adventurer",       "sexuality": "bisexual",     "occupation": "Marine Biologist",                 "nationality": "Senegalese-French",    "background": "Studies coral reef resilience in the Maldives and Mozambique. Free-dives to 20m without thinking about it."},
    {"name": "Caitlin Murphy",    "age": 25, "archetype": "adventurer",       "sexuality": "heterosexual", "occupation": "National Park Ranger",             "nationality": "American",             "background": "Patagonia first, Yosemite now. Knows every trail, hates every fence. Hiked 800 miles solo at 21 to get the job."},
    {"name": "Nadia Volkov",      "age": 31, "archetype": "adventurer",       "sexuality": "heterosexual", "occupation": "Expedition Leader",                "nationality": "Russian",              "background": "Led three polar expeditions. Writes a dry, funny blog about the absurdity of extreme environments. Fluent in three languages."},
    {"name": "Yuna Kim",          "age": 23, "archetype": "adventurer",       "sexuality": "heterosexual", "occupation": "Professional Rock Climber",        "nationality": "Korean",               "background": "Competition circuit in Asia and Europe. Sends V9 boulder problems on lunch breaks. Thinks fear is a calibration tool."},
    {"name": "Rosa Mendez",       "age": 28, "archetype": "adventurer",       "sexuality": "heterosexual", "occupation": "Scuba Diving Instructor",           "nationality": "Argentine",            "background": "Runs her own dive school in Roatán. Collects dive certifications the way others collect stamps. Grows her own vegetables."},
    {"name": "Astrid Berg",       "age": 33, "archetype": "adventurer",       "sexuality": "lesbian",      "occupation": "Wilderness Survival Instructor",   "nationality": "Danish",               "background": "Trains military and civilian survival skills in Scandinavian winters. Wrote a well-regarded wilderness medicine handbook."},

    # ── CAREERIST ─────────────────────────────────────────────────────────────
    {"name": "Aisha Johnson",     "age": 32, "archetype": "careerist",        "sexuality": "heterosexual", "occupation": "Marketing Director",               "nationality": "African-American",     "background": "Grew up in Atlanta, Harvard MBA. Built three brands from zero. Can pitch anything in 90 seconds and mean it."},
    {"name": "Emma Chen",         "age": 29, "archetype": "careerist",        "sexuality": "heterosexual", "occupation": "Investment Banker",                "nationality": "Chinese-British",      "background": "Goldman Sachs London. Works 70-hour weeks and reads novels on planes to stay human. Has a suspiciously green houseplant."},
    {"name": "Lucia Fernandez",   "age": 34, "archetype": "careerist",        "sexuality": "heterosexual", "occupation": "Startup Founder",                  "nationality": "Spanish",              "background": "Series B SaaS company, 60-person team. Third startup. Failed twice, succeeded spectacularly once. Prefers founders over VCs at dinner."},
    {"name": "Rachel Kim",        "age": 31, "archetype": "careerist",        "sexuality": "heterosexual", "occupation": "Corporate Lawyer",                 "nationality": "Korean-American",      "background": "M&A partner track at Sullivan & Cromwell NYC. Argues for sport and salary. Switches off completely at weekends."},
    {"name": "Natasha Ivanova",   "age": 36, "archetype": "careerist",        "sexuality": "heterosexual", "occupation": "Management Consultant",            "nationality": "Russian",              "background": "McKinsey Principal. Has restructured companies on three continents. Exhausting in the best way. Loves opera ironically and unironically."},
    {"name": "Deepika Reddy",     "age": 30, "archetype": "careerist",        "sexuality": "heterosexual", "occupation": "Product Manager",                  "nationality": "Indian",               "background": "PM at a late-stage fintech in Bangalore. Obsessed with user psychology and removing friction. Has seventeen sticky notes on one monitor."},
    {"name": "Charlotte Williams","age": 28, "archetype": "careerist",        "sexuality": "bisexual",     "occupation": "Brand Strategist",                 "nationality": "British",              "background": "Brand director at a creative agency, clients across FTSE 100. Equally at home in a boardroom or a moodboard session."},
    {"name": "Amelia Park",       "age": 33, "archetype": "careerist",        "sexuality": "heterosexual", "occupation": "Engineering Lead",                 "nationality": "Korean-Australian",    "background": "Leads platform infrastructure at a Melbourne-based unicorn. Codes daily despite the title. Runs 10k before most people wake up."},
    {"name": "Sienna Rossi",      "age": 35, "archetype": "careerist",        "sexuality": "heterosexual", "occupation": "Venture Capitalist",               "nationality": "Italian-American",     "background": "Partner at a deep tech VC in New York. Italian-American family who expected law; she chose risk. No regrets visible."},

    # ── NURTURER ──────────────────────────────────────────────────────────────
    {"name": "Grace Roberts",     "age": 28, "archetype": "nurturer",         "sexuality": "heterosexual", "occupation": "Pediatric Nurse",                  "nationality": "British",              "background": "GOSH nurse for five years. Has a gift for calm in crisis and a laugh that reliably un-tenses a room."},
    {"name": "Anna Kowalski",     "age": 31, "archetype": "nurturer",         "sexuality": "heterosexual", "occupation": "Primary School Teacher",           "nationality": "Polish",               "background": "Year 3 teacher in Kraków. Makes learning feel like play. Her students write her letters for years after she moves on."},
    {"name": "Fatima Al-Hassan",  "age": 27, "archetype": "nurturer",         "sexuality": "heterosexual", "occupation": "Child Psychologist",               "nationality": "Moroccan",             "background": "Works with trauma-exposed children in Casablanca. Gentle in every direction. Has a waiting list and a strict no-phone rule at dinner."},
    {"name": "Jennifer Garcia",   "age": 34, "archetype": "nurturer",         "sexuality": "heterosexual", "occupation": "Social Worker",                    "nationality": "Mexican-American",     "background": "Fifteen years in child protective services in LA. Has seen the worst and still shows up. Believes in people harder than they believe in themselves."},
    {"name": "Hana Suzuki",       "age": 29, "archetype": "nurturer",         "sexuality": "heterosexual", "occupation": "Therapist",                        "nationality": "Japanese",             "background": "Integrative psychotherapist in Tokyo. Trained in CBT and somatic work. Never checks her phone during a session. Obviously."},
    {"name": "Clara Santos",      "age": 26, "archetype": "nurturer",         "sexuality": "bisexual",     "occupation": "Speech Therapist",                 "nationality": "Brazilian",            "background": "Works with non-verbal children in São Paulo. Celebrates small victories loudly. Cries at graduation ceremonies every single time."},
    {"name": "Maria Petrides",    "age": 33, "archetype": "nurturer",         "sexuality": "heterosexual", "occupation": "Palliative Care Nurse",            "nationality": "Greek-Australian",     "background": "Works in end-of-life care in Melbourne. Has a quietness earned through being present for the hardest moments. Dances to break the solemnity."},
    {"name": "Layla Ibrahim",     "age": 30, "archetype": "nurturer",         "sexuality": "heterosexual", "occupation": "Life Coach",                       "nationality": "Egyptian",             "background": "Moved from Cairo to coach women through career transitions. Former teacher. Her sessions are equal parts challenge and warmth."},
    {"name": "Brigid O'Connor",   "age": 35, "archetype": "nurturer",         "sexuality": "lesbian",      "occupation": "Veterinary Technician",            "nationality": "Irish",                "background": "Runs a small animal rescue alongside her clinic job in Galway. Has three rescue dogs and the same number of opinions about feline nutrition."},

    # ── REBEL ─────────────────────────────────────────────────────────────────
    {"name": "Storm Nguyen",      "age": 24, "archetype": "rebel",            "sexuality": "queer",        "occupation": "Community Organiser",              "nationality": "Vietnamese-American",  "background": "Housing justice organiser in Oakland. Has been arrested twice for actions she's proud of. Makes incredible bánh mì."},
    {"name": "Raven Black",       "age": 26, "archetype": "rebel",            "sexuality": "bisexual",     "occupation": "Tattoo Artist",                    "nationality": "British",              "background": "Runs a collective studio in Shoreditch. Her work is narrative and dark. Hates flash; loves custom pieces that mean something."},
    {"name": "Jesse Martinez",    "age": 27, "archetype": "rebel",            "sexuality": "heterosexual", "occupation": "Alternative Musician",             "nationality": "Puerto Rican",         "background": "Three albums, no label, full artistic control. Tours independently across the US and South America. Earns less, means more."},
    {"name": "Daria Sokolova",    "age": 29, "archetype": "rebel",            "sexuality": "heterosexual", "occupation": "Investigative Journalist",          "nationality": "Russian",              "background": "Investigates oligarch money flows for a European outlet. Has received threats she documents carefully. Doesn't scare easily."},
    {"name": "Indie Harper",      "age": 23, "archetype": "rebel",            "sexuality": "pansexual",    "occupation": "Street Artist",                    "nationality": "American",             "background": "Wheat-pasting and stencil work across six cities. Her murals reference climate science and folklore simultaneously. Avoids Instagram."},
    {"name": "Zola Abeba",        "age": 28, "archetype": "rebel",            "sexuality": "lesbian",      "occupation": "Documentary Filmmaker",            "nationality": "Ethiopian-Swedish",    "background": "Documentaries on queer life in East Africa. Shown at Sundance. The Swedish half funds; the Ethiopian half drives."},
    {"name": "Sloane Mitchell",   "age": 31, "archetype": "rebel",            "sexuality": "bisexual",     "occupation": "Stand-up Comedian",                "nationality": "American",             "background": "Forty-five minute special on Netflix. Known for material that makes uncomfortable things funny without letting anyone off the hook."},
    {"name": "Romy Fischer",      "age": 25, "archetype": "rebel",            "sexuality": "heterosexual", "occupation": "Feminist Writer",                  "nationality": "German",               "background": "Writes a widely-read Substack on gender politics and labour. Her essays get quoted back to her in arguments by people who don't know she wrote them."},
    {"name": "Taryn Walsh",       "age": 30, "archetype": "rebel",            "sexuality": "heterosexual", "occupation": "Labour Rights Lawyer",             "nationality": "Irish-Australian",     "background": "Pro bono labour law in Melbourne. Union side, always. Has argued before the Fair Work Commission 40 times. Wins more than she loses."},

    # ── SOCIAL BUTTERFLY ──────────────────────────────────────────────────────
    {"name": "Mia Thompson",      "age": 24, "archetype": "social_butterfly", "sexuality": "heterosexual", "occupation": "Social Media Influencer",           "nationality": "American",             "background": "2.1M on Instagram, equally known at her local coffee shop. Started posting about her recovery from anxiety; stayed for the community."},
    {"name": "Jasmine Williams",  "age": 26, "archetype": "social_butterfly", "sexuality": "heterosexual", "occupation": "Event Planner",                    "nationality": "African-American",     "background": "Has planned 200 weddings, never been to a bad one. Treats every event like a love letter to the guests. Atlanta to New York."},
    {"name": "Chloe Martin",      "age": 28, "archetype": "social_butterfly", "sexuality": "bisexual",     "occupation": "PR Director",                      "nationality": "French-Canadian",      "background": "Runs a boutique PR firm in Montréal. Knows the journalists, knows the chefs, knows the artists. The city comes to her."},
    {"name": "Bella Santos",      "age": 23, "archetype": "social_butterfly", "sexuality": "heterosexual", "occupation": "Brand Ambassador",                 "nationality": "Brazilian",            "background": "Face of three sustainable fashion brands before 23. Goes out every night, meditates every morning. Genuinely happy."},
    {"name": "Sasha Petrova",     "age": 27, "archetype": "social_butterfly", "sexuality": "heterosexual", "occupation": "TV Presenter",                     "nationality": "Russian",              "background": "Presents a lifestyle show in Moscow. Known for her warmth on screen and her brutal honesty off it."},
    {"name": "Lily Chang",        "age": 25, "archetype": "social_butterfly", "sexuality": "heterosexual", "occupation": "Lifestyle Blogger",                "nationality": "Taiwanese-American",   "background": "Hosts a podcast and writes a newsletter. Built an audience on honesty about mental health and good recommendations for everything else."},
    {"name": "Bianca Rossi",      "age": 30, "archetype": "social_butterfly", "sexuality": "heterosexual", "occupation": "Talent Agent",                     "nationality": "Italian",              "background": "Represents writers and directors in Rome and London. Her Rolodex is her superpower. She doesn't lose touch with people."},
    {"name": "Naomi Jackson",     "age": 29, "archetype": "social_butterfly", "sexuality": "heterosexual", "occupation": "Club DJ",                          "nationality": "Jamaican-British",     "background": "Residencies in London, Ibiza, and Berlin. Her sets are technically serious and emotionally generous. The room feels her before they hear her."},
    {"name": "Pippa Clarke",      "age": 32, "archetype": "social_butterfly", "sexuality": "heterosexual", "occupation": "Charity Gala Organiser",           "nationality": "British",              "background": "Raises millions for medical research through events that people queue to attend. Knows every philanthropist in London under 50."},

    # ── HOMEBODY ──────────────────────────────────────────────────────────────
    {"name": "Clara Weber",       "age": 27, "archetype": "homebody",         "sexuality": "heterosexual", "occupation": "Remote Software Developer",        "nationality": "German",               "background": "Full-stack dev for a Berlin company, works entirely from her flat in Leipzig. Her apartment is dialled. Her social circle is small and permanent."},
    {"name": "Ellie Brooks",      "age": 29, "archetype": "homebody",         "sexuality": "heterosexual", "occupation": "Pastry Chef",                      "nationality": "British",              "background": "Small patisserie in Bath. Opens at 7am, closes at 2pm. Afternoons are books, walks, and long cooking experiments nobody asked for."},
    {"name": "Akemi Sato",        "age": 25, "archetype": "homebody",         "sexuality": "heterosexual", "occupation": "Literary Translator",              "nationality": "Japanese",             "background": "Translates Japanese fiction into English. Lives with three cats and a great selection of tea. Correspondence is her preferred form of friendship."},
    {"name": "Nora Lynch",        "age": 31, "archetype": "homebody",         "sexuality": "heterosexual", "occupation": "Librarian",                        "nationality": "Irish-American",       "background": "Reference librarian in Boston. Knows where everything is and how to find what you didn't know you needed. Fiercely protective of quiet."},
    {"name": "Petra Novak",       "age": 28, "archetype": "homebody",         "sexuality": "heterosexual", "occupation": "Video Game Developer",             "nationality": "Czech",                "background": "Indie game dev in Prague. Her games are small, melancholy, and beautiful. Doesn't do social media; ships updates in long newsletter posts."},
    {"name": "Hana Park",         "age": 24, "archetype": "homebody",         "sexuality": "bisexual",     "occupation": "Copy Editor",                      "nationality": "Korean",               "background": "Freelance copy editor for publishing houses. Works in a corner with excellent light. Her red pen is a love language."},
    {"name": "Ingrid Holm",       "age": 33, "archetype": "homebody",         "sexuality": "heterosexual", "occupation": "Tax Accountant",                   "nationality": "Norwegian",            "background": "Solo practice in Bergen. Has memorised every tax code and apologises for nothing. Bakes elaborate cakes on the weekend to reset."},
    {"name": "Vera Kozlov",       "age": 26, "archetype": "homebody",         "sexuality": "lesbian",      "occupation": "Data Analyst",                     "nationality": "Russian",              "background": "Fully remote for a fintech. Lives in St. Petersburg in an apartment full of plants and feminist theory. Excellent at Scrabble."},
    {"name": "Beth Lawson",       "age": 30, "archetype": "homebody",         "sexuality": "heterosexual", "occupation": "Museum Archivist",                 "nationality": "American",             "background": "Archives 19th century photography at the Smithsonian. Knows the provenance of objects most people walk past. Slow to trust, permanently loyal."},

    # ── ATHLETE ───────────────────────────────────────────────────────────────
    {"name": "Jordana Rivera",    "age": 24, "archetype": "athlete",          "sexuality": "heterosexual", "occupation": "Personal Trainer",                 "nationality": "Colombian-American",   "background": "Started training at 14 after her sister's injury. Now coaches semi-pro athletes in Miami. Can spot a compensation pattern in three seconds."},
    {"name": "Aiko Tanaka",       "age": 22, "archetype": "athlete",          "sexuality": "heterosexual", "occupation": "Competitive Swimmer",              "nationality": "Japanese",             "background": "800m and 1500m freestyle. Trains twice daily, reads about sports psychology in the gaps. Wants to compete at the 2028 Olympics."},
    {"name": "Serena Okafor",     "age": 27, "archetype": "athlete",          "sexuality": "heterosexual", "occupation": "CrossFit Coach",                   "nationality": "Nigerian-British",     "background": "Competed at the CrossFit Games twice. Coaches in London. Uncompromising about form; completely warm about everything else."},
    {"name": "Lily Chen",         "age": 25, "archetype": "athlete",          "sexuality": "bisexual",     "occupation": "Yoga Instructor",                  "nationality": "Chinese-Australian",   "background": "Ashtanga practitioner since 16. Teaches in Melbourne and leads retreats in Bali. Her classes are harder than they look."},
    {"name": "Kayla Reeves",      "age": 28, "archetype": "athlete",          "sexuality": "heterosexual", "occupation": "Sports Physiotherapist",            "nationality": "American",             "background": "Works with an NBA development team in Phoenix. Fixes the problem and fixes the pattern that caused it. Runs marathons off-season for fun."},
    {"name": "Marta Silva",       "age": 26, "archetype": "athlete",          "sexuality": "heterosexual", "occupation": "Professional Footballer",           "nationality": "Portuguese",           "background": "Midfield for a Primeira Liga women's team. Scholarship kid from Porto who made it. Has a brother who supports the wrong team."},
    {"name": "Nadia Osman",       "age": 23, "archetype": "athlete",          "sexuality": "heterosexual", "occupation": "Track and Field Athlete",          "nationality": "Somali-British",       "background": "400m and 400m hurdles. Training base in Loughborough. First in her family to compete internationally. Doesn't give interviews but gives everything on the track."},
    {"name": "Erin Walsh",        "age": 29, "archetype": "athlete",          "sexuality": "heterosexual", "occupation": "Dance Movement Therapist",         "nationality": "Irish",                "background": "Uses movement as therapy for trauma and addiction recovery in Dublin. Former contemporary dancer. Knows exactly how the body holds what the mind won't say."},
    {"name": "Birgit Johansson",  "age": 31, "archetype": "athlete",          "sexuality": "heterosexual", "occupation": "Sports Nutritionist",              "nationality": "Swedish",              "background": "Works with Swedish Olympic athletes. Evidence-only approach. Writes a newsletter debunking sports nutrition myths that coaches forward to their teams."},

    # ── SPIRITUALIST ──────────────────────────────────────────────────────────
    {"name": "Luna Santana",      "age": 29, "archetype": "spiritualist",     "sexuality": "bisexual",     "occupation": "Meditation Teacher",               "nationality": "Mexican",              "background": "Trained in Vipassana and non-dual teaching. Teaches in Mexico City and online. Her students come for the calm and stay for the clarity."},
    {"name": "Devi Patel",        "age": 32, "archetype": "spiritualist",     "sexuality": "heterosexual", "occupation": "Yoga Retreat Organiser",           "nationality": "Indian-British",       "background": "Runs immersive retreats in Kerala and the Cotswolds. Ex-corporate lawyer who needed to breathe. Traded the firm for the ashram at 27 and never looked back."},
    {"name": "Celeste Moon",      "age": 27, "archetype": "spiritualist",     "sexuality": "pansexual",    "occupation": "Astrologer and Tarot Reader",      "nationality": "American",             "background": "Has 200k followers who come for the astrology and stay for the jungian depth behind it. Studied philosophy before learning to read charts."},
    {"name": "Hana Watanabe",     "age": 30, "archetype": "spiritualist",     "sexuality": "heterosexual", "occupation": "Reiki Practitioner",               "nationality": "Japanese",             "background": "Third-generation practitioner from Kyoto. Combines traditional Usui Reiki with modern somatic understanding. Runs a small, beloved clinic."},
    {"name": "Sage Williams",     "age": 25, "archetype": "spiritualist",     "sexuality": "queer",        "occupation": "Herbalist and Healer",             "nationality": "American",             "background": "Grows most of what she uses. Studied botany and ethnobotany formally before going independent. Part witch, part scientist, entirely serious."},
    {"name": "Anaya Obi",         "age": 28, "archetype": "spiritualist",     "sexuality": "heterosexual", "occupation": "Ayurvedic Practitioner",           "nationality": "Nigerian",             "background": "Trained in Kerala, practises in Lagos. Bridges traditional Ayurveda with West African healing traditions. Her waiting list is six weeks long."},
    {"name": "River Santos",      "age": 33, "archetype": "spiritualist",     "sexuality": "bisexual",     "occupation": "Spiritual Author and Speaker",    "nationality": "Brazilian",            "background": "Two books on conscious relationships. Jungian psychology meets Brazilian mysticism. Speaks at conferences and cries at nature, usually the same day."},
    {"name": "Isis Nkosi",        "age": 31, "archetype": "spiritualist",     "sexuality": "heterosexual", "occupation": "Transformational Life Coach",      "nationality": "South African",        "background": "Works with high-achievers in Cape Town who've lost the thread. Former executive who had her own breakdown and built a career out of not repeating it."},
    {"name": "Zara Malik",        "age": 26, "archetype": "spiritualist",     "sexuality": "heterosexual", "occupation": "Sound Healer",                     "nationality": "Pakistani",            "background": "Uses singing bowls, gongs, and voice in therapeutic contexts in Lahore and London. Scientifically literate about what she does and why it works."},

    # ── FREE SPIRIT ───────────────────────────────────────────────────────────
    {"name": "Jade Morin",        "age": 24, "archetype": "free_spirit",      "sexuality": "bisexual",     "occupation": "Digital Nomad and UX Freelancer", "nationality": "French",               "background": "Last stable address: Paris, three years ago. Currently Medellín. Works 20 hours a week and spends the rest exploring. Has excellent taste and no fixed plans."},
    {"name": "Tallulah James",    "age": 26, "archetype": "free_spirit",      "sexuality": "pansexual",    "occupation": "Surf Instructor",                  "nationality": "Australian",           "background": "Grew up in Byron Bay, moved to Portugal. Teaches surfing all week and works on her novel all night. Has a theory that all wisdom is amphibious."},
    {"name": "Wren Parker",       "age": 28, "archetype": "free_spirit",      "sexuality": "queer",        "occupation": "Organic Farmer",                   "nationality": "American",             "background": "Quit her PhD to grow food in Vermont. Her farm hosts residencies for artists. Has strong opinions about soil health and very few about anything else."},
    {"name": "Skye MacLeod",      "age": 23, "archetype": "free_spirit",      "sexuality": "heterosexual", "occupation": "Hostel Manager",                   "nationality": "Scottish",             "background": "Has managed hostels in Lisbon, Bangkok, and Tulum. Collects languages slowly and strangers quickly. Is building something, just not sure what yet."},
    {"name": "Indigo Chen",       "age": 27, "archetype": "free_spirit",      "sexuality": "bisexual",     "occupation": "Busker and Street Musician",       "nationality": "Malaysian-British",    "background": "Classical violin training then world music then street corners in Barcelona. Makes more than she needs and needs less than she could. Very content."},
    {"name": "Autumn Hayes",      "age": 29, "archetype": "free_spirit",      "sexuality": "heterosexual", "occupation": "Craft Market Artisan",             "nationality": "American",             "background": "Makes hand-dyed textiles and pottery that sell before she finishes them. Travels the market circuit from Santa Fe to Asheville. Lives in a 1973 Airstream."},
    {"name": "Meadow Torres",     "age": 31, "archetype": "free_spirit",      "sexuality": "heterosexual", "occupation": "Travelling Private Chef",          "nationality": "Argentine",            "background": "Cooks for a rotating cast of clients across Europe and South America. Uses local ingredients wherever she lands. Has eaten in 48 countries; home is wherever the kitchen is good."},
    {"name": "Cosima Bauer",      "age": 25, "archetype": "free_spirit",      "sexuality": "heterosexual", "occupation": "Permaculture Designer",            "nationality": "German",               "background": "Designs food forests and urban gardens across Bavaria. Lives in an intentional community. Has read every Ivan Illich book twice."},
    {"name": "Nova Okonkwo",      "age": 30, "archetype": "free_spirit",      "sexuality": "lesbian",      "occupation": "Travelling Portrait Artist",       "nationality": "Nigerian-American",    "background": "Travels to paint people in their contexts — fishermen in Senegal, factory workers in Shenzhen, ranchers in Montana. Sells prints to fund the next trip."},

    # ── TRADITIONALIST ────────────────────────────────────────────────────────
    {"name": "Emily Taylor",      "age": 29, "archetype": "traditionalist",   "sexuality": "heterosexual", "occupation": "Nurse",                            "nationality": "British",              "background": "Surgical ward at Leeds General. Third-generation NHS worker. Knows the value of a long shift and a long table with everyone round it."},
    {"name": "Caitlin Byrne",     "age": 31, "archetype": "traditionalist",   "sexuality": "heterosexual", "occupation": "Office Administrator",             "nationality": "Irish",                "background": "Runs a mid-size solicitors' office in Limerick with quiet, total command. Organises everything from the summer barbecue to the filing system. Indispensable."},
    {"name": "Michelle Davis",    "age": 33, "archetype": "traditionalist",   "sexuality": "heterosexual", "occupation": "Bank Branch Manager",              "nationality": "African-American",     "background": "Manages a Chase branch in Charlotte. Active in her church community. Has never missed a Sunday with her family. Genuinely believes in what she does."},
    {"name": "Kristina Hofer",    "age": 28, "archetype": "traditionalist",   "sexuality": "heterosexual", "occupation": "Homemaker and Baker",              "nationality": "Austrian",             "background": "Left marketing to raise her family in Vienna. Has a baking Instagram that's completely unironic and warmly followed. Considers hospitality a calling."},
    {"name": "Soo-Jin Park",      "age": 27, "archetype": "traditionalist",   "sexuality": "heterosexual", "occupation": "Certified Accountant",             "nationality": "Korean",               "background": "CPA at a Seoul firm. Saves 30% of her income and knows where every won goes. Her discipline is deep, not performance. Warm and funny to those she trusts."},
    {"name": "Marie Girard",      "age": 34, "archetype": "traditionalist",   "sexuality": "heterosexual", "occupation": "Family Counsellor",               "nationality": "French",               "background": "Catholic marriage and family counsellor in Lyon. Genuinely believes in permanence and helps others find it. Practical about love and idealistic about commitment."},
    {"name": "Nkechi Obi",        "age": 30, "archetype": "traditionalist",   "sexuality": "heterosexual", "occupation": "Community Leader",                 "nationality": "Nigerian-British",     "background": "Runs a community centre in Peckham. Organises the church choir, the food bank, and the youth mentoring programme. People do what she asks because she's already done it herself."},
    {"name": "Isabella Moretti",  "age": 32, "archetype": "traditionalist",   "sexuality": "heterosexual", "occupation": "Parenting Blogger and Homemaker",  "nationality": "Italian",              "background": "Raised in Florence, now in Rome with her family. Writes authentically about Catholic motherhood without sentimentality. Her comment section is her community."},
    {"name": "Grace Park",        "age": 26, "archetype": "traditionalist",   "sexuality": "heterosexual", "occupation": "Primary School Teacher",           "nationality": "Korean-American",      "background": "Year 2 teacher in a Title I school in Los Angeles. Her students are mostly immigrant children. She arrived as one. Comes early, stays late, never discusses it."},
]


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def pick(pool, index):
    return pool[index % len(pool)]


def pick_n(pool, index, n):
    start = (index * n) % len(pool)
    return [pool[(start + i) % len(pool)] for i in range(n)]


def build_persona(seed, archetype_data, hobby_pool, index_in_archetype):
    i = index_in_archetype
    arch = archetype_data[seed["archetype"]]
    traits = pick_n(arch["personality_trait_pool"], i, 4)
    hobbies = pick_n(hobby_pool[seed["archetype"]], i * 3, 3)

    return {
        "name": seed["name"],
        "age": seed["age"],
        "gender": "female",
        "sexuality": seed["sexuality"],
        "archetype": seed["archetype"],
        "occupation": seed["occupation"],
        "nationality": seed["nationality"],
        "hobbies": hobbies,
        "behaviour": pick(arch["behaviour_pool"], i),
        "personality_traits": traits,
        "communication_style": pick(arch["communication_style_pool"], i),
        "relationship_goals": pick(arch["relationship_goals_pool"], i),
        "background": seed["background"],
    }


def main():
    os.makedirs(PERSONAS_DIR, exist_ok=True)
    archetypes = load_json(os.path.join(FRAGMENTS_DIR, "archetypes.json"))
    hobbies = load_json(os.path.join(FRAGMENTS_DIR, "hobbies.json"))

    archetype_counters = {}
    generated = 0

    for seed in PERSONA_SEEDS:
        arch = seed["archetype"]
        idx = archetype_counters.get(arch, 0)
        archetype_counters[arch] = idx + 1

        persona = build_persona(seed, archetypes, hobbies, idx)

        slug = seed["name"].lower().replace(" ", "_").replace("'", "")
        filename = f"{arch}_{idx+1:02d}_{slug}.json"
        path = os.path.join(PERSONAS_DIR, filename)

        with open(path, "w", encoding="utf-8") as f:
            json.dump(persona, f, indent=2, ensure_ascii=False)

        generated += 1

    print(f"Generated {generated} personas → {PERSONAS_DIR}")


if __name__ == "__main__":
    main()
