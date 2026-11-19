// Rich, distinctive SVG thumbnails for all YARO AR Effects & Beauty Presets
// Ensures every single effect in the carousel looks completely unique and recognizable.

const THUMBNAILS: Record<string, string> = {
  // === ANIMALS ===
  puppy: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#2A1B18"/>
    <!-- Left Floppy Ear -->
    <path d="M42 42 C24 50 18 80 26 102 C32 118 48 114 46 95 C44 80 48 55 58 48 Z" fill="#C58341" stroke="#8A5223" stroke-width="2.5"/>
    <path d="M30 65 C26 80 32 98 38 100 C42 98 40 85 38 72 Z" fill="#FFAAA6"/>
    <!-- Right Floppy Ear -->
    <path d="M118 42 C136 50 142 80 134 102 C128 118 112 114 114 95 C116 80 112 55 102 48 Z" fill="#C58341" stroke="#8A5223" stroke-width="2.5"/>
    <path d="M130 65 C134 80 128 98 122 100 C118 98 120 85 122 72 Z" fill="#FFAAA6"/>
    <!-- Head Base -->
    <ellipse cx="80" cy="82" rx="42" ry="38" fill="#E6A868"/>
    <!-- White Muzzle -->
    <ellipse cx="80" cy="94" rx="26" ry="19" fill="#FFF3E0"/>
    <!-- Cute Eyes -->
    <circle cx="64" cy="74" r="6" fill="#1C1917"/>
    <circle cx="62" cy="72" r="2" fill="#FFFFFF"/>
    <circle cx="96" cy="74" r="6" fill="#1C1917"/>
    <circle cx="94" cy="72" r="2" fill="#FFFFFF"/>
    <!-- Blushing Cheeks -->
    <circle cx="54" cy="90" r="7" fill="#FF8A80" opacity="0.45"/>
    <circle cx="106" cy="90" r="7" fill="#FF8A80" opacity="0.45"/>
    <!-- Black Dog Button Nose -->
    <path d="M72 88 Q80 84 88 88 Q80 96 72 88 Z" fill="#1C1917"/>
    <circle cx="78" cy="87" r="1.5" fill="#FFFFFF"/>
    <!-- Sticking Out Pink Tongue -->
    <path d="M74 98 Q80 100 86 98 Q88 114 80 118 Q72 114 74 98 Z" fill="#FF5277"/>
    <line x1="80" y1="99" x2="80" y2="114" stroke="#D81B60" stroke-width="1.5"/>
    <!-- Text Label -->
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FDE047">Puppy</text>
  </svg>`,

  kitty: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#251829"/>
    <!-- Left Pointed Cat Ear -->
    <polygon points="36,68 56,26 74,58" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
    <polygon points="44,62 56,36 68,56" fill="#FF8DA1"/>
    <!-- Right Pointed Cat Ear -->
    <polygon points="124,68 104,26 86,58" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
    <polygon points="116,62 104,36 92,56" fill="#FF8DA1"/>
    <!-- Cat Head -->
    <ellipse cx="80" cy="85" rx="42" ry="36" fill="#FFFFFF"/>
    <!-- Cat Eyes -->
    <ellipse cx="62" cy="78" rx="6" ry="8" fill="#10B981"/>
    <ellipse cx="62" cy="78" rx="2" ry="6" fill="#064E3B"/>
    <circle cx="60" cy="75" r="2" fill="#FFFFFF"/>
    <ellipse cx="98" cy="78" rx="6" ry="8" fill="#10B981"/>
    <ellipse cx="98" cy="78" rx="2" ry="6" fill="#064E3B"/>
    <circle cx="96" cy="75" r="2" fill="#FFFFFF"/>
    <!-- Pink Cat Nose -->
    <polygon points="76,89 84,89 80,94" fill="#FF6584"/>
    <!-- Cute Cat Mouth -->
    <path d="M74 96 Q80 99 80 94 Q80 99 86 96" fill="none" stroke="#4B5563" stroke-width="2" stroke-linecap="round"/>
    <!-- 6 Whiskers -->
    <line x1="42" y1="87" x2="16" y2="83" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
    <line x1="40" y1="92" x2="14" y2="92" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
    <line x1="42" y1="97" x2="18" y2="101" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
    <line x1="118" y1="87" x2="144" y2="83" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
    <line x1="120" y1="92" x2="146" y2="92" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
    <line x1="118" y1="97" x2="142" y2="101" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
    <circle cx="52" cy="94" r="6" fill="#FF80AB" opacity="0.4"/>
    <circle cx="108" cy="94" r="6" fill="#FF80AB" opacity="0.4"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#F472B6">Kitty</text>
  </svg>`,

  bunny: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#21182A"/>
    <!-- Left Tall Bunny Ear -->
    <path d="M50 80 C40 40 45 16 58 18 C70 20 68 50 64 80 Z" fill="#FFFFFF"/>
    <path d="M53 72 C48 42 50 25 58 26 C64 27 63 50 60 72 Z" fill="#FFB6C1"/>
    <!-- Right Folded Bunny Ear -->
    <path d="M110 80 C120 50 115 30 102 24 C96 22 92 28 94 36 C96 46 102 60 98 80 Z" fill="#FFFFFF"/>
    <path d="M107 72 C114 52 110 38 102 34 C98 33 97 38 98 44 C100 52 101 62 97 72 Z" fill="#FFB6C1"/>
    <!-- Head -->
    <ellipse cx="80" cy="96" rx="38" ry="34" fill="#FFFFFF"/>
    <!-- Eyes -->
    <circle cx="65" cy="90" r="5" fill="#4A044E"/>
    <circle cx="63" cy="88" r="1.5" fill="#FFFFFF"/>
    <circle cx="95" cy="90" r="5" fill="#4A044E"/>
    <circle cx="93" cy="88" r="1.5" fill="#FFFFFF"/>
    <!-- Bunny Pink Nose -->
    <polygon points="76,98 84,98 80,103" fill="#FF6584"/>
    <!-- Buck Teeth -->
    <rect x="76" y="104" width="4" height="6" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="0.8"/>
    <rect x="80" y="104" width="4" height="6" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="0.8"/>
    <!-- Whiskers -->
    <line x1="50" y1="100" x2="30" y2="98" stroke="#9CA3AF" stroke-width="1.5"/>
    <line x1="50" y1="104" x2="32" y2="106" stroke="#9CA3AF" stroke-width="1.5"/>
    <line x1="110" y1="100" x2="130" y2="98" stroke="#9CA3AF" stroke-width="1.5"/>
    <line x1="110" y1="104" x2="128" y2="106" stroke="#9CA3AF" stroke-width="1.5"/>
    <circle cx="56" cy="100" r="7" fill="#FF80AB" opacity="0.35"/>
    <circle cx="104" cy="100" r="7" fill="#FF80AB" opacity="0.35"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#F472B6">Bunny</text>
  </svg>`,

  fox: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#241B18"/>
    <!-- Fox Ears -->
    <polygon points="34,70 48,22 76,56" fill="#EA580C"/>
    <polygon points="42,38 48,22 58,36" fill="#1C1917"/>
    <polygon points="46,58 52,36 66,52" fill="#FFF7ED"/>
    <polygon points="126,70 112,22 84,56" fill="#EA580C"/>
    <polygon points="118,38 112,22 102,36" fill="#1C1917"/>
    <polygon points="114,58 108,36 94,52" fill="#FFF7ED"/>
    <!-- Fox Face -->
    <path d="M40 76 Q80 72 120 76 Q115 110 80 122 Q45 110 40 76 Z" fill="#EA580C"/>
    <path d="M52 86 Q80 82 80 120 Q56 106 52 86 Z" fill="#FFF7ED"/>
    <path d="M108 86 Q80 82 80 120 Q104 106 108 86 Z" fill="#FFF7ED"/>
    <!-- Eyes -->
    <ellipse cx="64" cy="84" rx="5" ry="3" fill="#1C1917" transform="rotate(-15 64 84)"/>
    <ellipse cx="96" cy="84" rx="5" ry="3" fill="#1C1917" transform="rotate(15 96 84)"/>
    <!-- Black Snout -->
    <circle cx="80" cy="116" r="4.5" fill="#1C1917"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FB923C">Fox</text>
  </svg>`,

  panda: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#1E2328"/>
    <!-- Round Black Ears -->
    <circle cx="48" cy="48" r="20" fill="#1F2937"/>
    <circle cx="112" cy="48" r="20" fill="#1F2937"/>
    <!-- White Face -->
    <ellipse cx="80" cy="86" rx="42" ry="36" fill="#FFFFFF"/>
    <!-- Black Eye Patches -->
    <ellipse cx="62" cy="80" rx="12" ry="15" fill="#1F2937" transform="rotate(-20 62 80)"/>
    <circle cx="64" cy="79" r="4" fill="#FFFFFF"/>
    <ellipse cx="98" cy="80" rx="12" ry="15" fill="#1F2937" transform="rotate(20 98 80)"/>
    <circle cx="96" cy="79" r="4" fill="#FFFFFF"/>
    <!-- Cute Nose -->
    <ellipse cx="80" cy="96" rx="7" ry="5" fill="#1F2937"/>
    <!-- Pink Cheeks -->
    <circle cx="50" cy="98" r="7" fill="#F472B6" opacity="0.5"/>
    <circle cx="110" cy="98" r="7" fill="#F472B6" opacity="0.5"/>
    <!-- Bamboo Branch -->
    <path d="M116 108 Q124 100 134 94" stroke="#22C55E" stroke-width="3" fill="none"/>
    <ellipse cx="132" cy="94" rx="6" ry="3" fill="#22C55E" transform="rotate(-30 132 94)"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#E5E7EB">Panda</text>
  </svg>`,

  // === ACCESSORIES ===
  'royal-crown': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#261A10"/>
    <defs>
      <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFF275"/>
        <stop offset="50%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#B45309"/>
      </linearGradient>
    </defs>
    <!-- Sparkling Twinkle Stars -->
    <path d="M30 40 L34 50 L44 54 L34 58 L30 68 L26 58 L16 54 L26 50 Z" fill="#FDE047"/>
    <path d="M130 35 L133 42 L140 45 L133 48 L130 55 L127 48 L120 45 L127 42 Z" fill="#FDE047"/>
    <!-- Crown 5 Peaks -->
    <path d="M26 100 L34 56 L58 78 L80 42 L102 78 L126 56 L134 100 Z" fill="url(#goldG)" stroke="#F59E0B" stroke-width="2"/>
    <!-- Crown Rim Base -->
    <rect x="24" y="98" width="112" height="16" rx="4" fill="url(#goldG)" stroke="#B45309" stroke-width="2"/>
    <!-- Inlaid Gems -->
    <circle cx="80" cy="58" r="7" fill="#DC2626"/>
    <circle cx="80" cy="58" r="3" fill="#F87171"/>
    <circle cx="58" cy="84" r="5" fill="#16A34A"/>
    <circle cx="102" cy="84" r="5" fill="#2563EB"/>
    <!-- Base Pearls -->
    <circle cx="36" cy="106" r="3" fill="#FFFFFF"/>
    <circle cx="58" cy="106" r="3" fill="#FFFFFF"/>
    <circle cx="80" cy="106" r="3" fill="#FFFFFF"/>
    <circle cx="102" cy="106" r="3" fill="#FFFFFF"/>
    <circle cx="124" cy="106" r="3" fill="#FFFFFF"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FDE047">Royal Crown</text>
  </svg>`,

  'heart-glasses': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#261226"/>
    <!-- Glasses Bridge -->
    <path d="M72 74 Q80 70 88 74" fill="none" stroke="#F59E0B" stroke-width="4"/>
    <!-- Left Heart Lens -->
    <path d="M52 56 C36 44 20 62 34 82 L52 100 L70 82 C84 62 68 44 52 56 Z" fill="#EC4899" fill-opacity="0.8" stroke="#F59E0B" stroke-width="4"/>
    <!-- Reflection Line -->
    <line x1="38" y1="64" x2="48" y2="76" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <!-- Right Heart Lens -->
    <path d="M108 56 C92 44 76 62 90 82 L108 100 L126 82 C140 62 124 44 108 56 Z" fill="#EC4899" fill-opacity="0.8" stroke="#F59E0B" stroke-width="4"/>
    <line x1="94" y1="64" x2="104" y2="76" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#F472B6">Heart Glasses</text>
  </svg>`,

  'cyber-headset': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#0F172A"/>
    <!-- Headband Arch -->
    <path d="M34 82 C34 40 126 40 126 82" fill="none" stroke="#334155" stroke-width="8" stroke-linecap="round"/>
    <path d="M44 76 C44 48 116 48 116 76" fill="none" stroke="#00F0FF" stroke-width="2.5"/>
    <!-- Left Ear Cup -->
    <rect x="20" y="68" width="22" height="36" rx="10" fill="#1E293B" stroke="#00F0FF" stroke-width="3"/>
    <circle cx="31" cy="86" r="6" fill="#00F0FF"/>
    <!-- Right Ear Cup -->
    <rect x="118" y="68" width="22" height="36" rx="10" fill="#1E293B" stroke="#FF007F" stroke-width="3"/>
    <circle cx="129" cy="86" r="6" fill="#FF007F"/>
    <!-- Boom Microphone -->
    <path d="M36 96 Q46 116 72 112" fill="none" stroke="#64748B" stroke-width="3" stroke-linecap="round"/>
    <circle cx="74" cy="112" r="4" fill="#FF007F"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#38BDF8">Cyber Headset</text>
  </svg>`,

  // === EMOTIONS ===
  'cry-baby': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#172554"/>
    <!-- Face Base -->
    <circle cx="80" cy="78" r="42" fill="#FED7AA"/>
    <!-- Crying Closed Eyes -->
    <path d="M54 70 Q64 62 74 70" fill="none" stroke="#431407" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M86 70 Q96 62 106 70" fill="none" stroke="#431407" stroke-width="3.5" stroke-linecap="round"/>
    <!-- Trembling Mouth -->
    <path d="M68 96 Q74 90 80 96 Q86 90 92 96" fill="none" stroke="#9A3412" stroke-width="3" stroke-linecap="round"/>
    <!-- Stream of Tears Left -->
    <path d="M60 74 C52 86 52 112 60 124 C68 112 68 86 60 74 Z" fill="#38BDF8" opacity="0.85"/>
    <circle cx="58" cy="128" r="4" fill="#0284C7"/>
    <!-- Stream of Tears Right -->
    <path d="M100 74 C92 86 92 112 100 124 C108 112 108 86 100 74 Z" fill="#38BDF8" opacity="0.85"/>
    <circle cx="102" cy="128" r="4" fill="#0284C7"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#60A5FA">Cry Baby</text>
  </svg>`,

  'love-hearts': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#2E1020"/>
    <!-- Central Heart -->
    <path d="M80 60 C66 42 44 60 58 78 L80 102 L102 78 C116 60 94 42 80 60 Z" fill="#F43F5E"/>
    <!-- Small floating hearts -->
    <path d="M40 40 C32 30 20 40 28 50 L40 62 L52 50 C60 40 48 30 40 40 Z" fill="#FB7185"/>
    <path d="M120 44 C112 34 100 44 108 54 L120 66 L132 54 C140 44 128 34 120 44 Z" fill="#FB7185"/>
    <path d="M80 106 C74 100 66 106 72 112 L80 120 L88 112 C94 106 86 100 80 106 Z" fill="#FDA4AF"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FB7185">Love Hearts</text>
  </svg>`,

  // === SPECIAL & FANTASY ===
  'flame-face': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#280D05"/>
    <defs>
      <linearGradient id="fireG" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#DC2626"/>
        <stop offset="50%" stop-color="#F97316"/>
        <stop offset="100%" stop-color="#FDE047"/>
      </linearGradient>
    </defs>
    <!-- Outer Flame -->
    <path d="M80 20 C60 50 40 70 42 98 C44 122 62 126 80 126 C98 126 116 122 118 98 C120 70 100 50 80 20 Z" fill="url(#fireG)"/>
    <!-- Inner Flame -->
    <path d="M80 50 C68 70 56 85 58 106 C60 120 70 124 80 124 C90 124 100 120 102 106 C104 85 92 70 80 50 Z" fill="#FDE047"/>
    <!-- Core White Glow -->
    <ellipse cx="80" cy="112" rx="10" ry="12" fill="#FFFFFF" opacity="0.8"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#F97316">Flame Face</text>
  </svg>`,

  'flower-crown': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#1C2418"/>
    <!-- Green Leaf Vine -->
    <path d="M24 84 Q80 64 136 84" fill="none" stroke="#22C55E" stroke-width="4"/>
    <!-- Roses & Flowers -->
    <circle cx="80" cy="68" r="14" fill="#F43F5E"/>
    <circle cx="80" cy="68" r="8" fill="#FDA4AF"/>
    <circle cx="52" cy="74" r="11" fill="#FB7185"/>
    <circle cx="52" cy="74" r="6" fill="#FECDD3"/>
    <circle cx="108" cy="74" r="11" fill="#FBBF24"/>
    <circle cx="108" cy="74" r="6" fill="#FEF3C7"/>
    <circle cx="32" cy="84" r="8" fill="#C084FC"/>
    <circle cx="128" cy="84" r="8" fill="#C084FC"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#4ADE80">Flower Crown</text>
  </svg>`,

  butterflies: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#0C202F"/>
    <!-- Blue Morpho Butterfly -->
    <path d="M80 75 C70 45 42 45 46 72 C50 85 70 85 80 80 Z" fill="#00D2FF"/>
    <path d="M80 75 C90 45 118 45 114 72 C110 85 90 85 80 80 Z" fill="#00D2FF"/>
    <path d="M80 82 C68 84 54 98 62 108 C70 114 78 96 80 88 Z" fill="#0080FF"/>
    <path d="M80 82 C92 84 106 98 98 108 C90 114 82 96 80 88 Z" fill="#0080FF"/>
    <ellipse cx="80" cy="80" rx="2.5" ry="12" fill="#0F172A"/>
    <!-- Antennae -->
    <path d="M78 68 Q72 58 66 60" fill="none" stroke="#38BDF8" stroke-width="1.5"/>
    <path d="M82 68 Q88 58 94 60" fill="none" stroke="#38BDF8" stroke-width="1.5"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#38BDF8">Butterflies</text>
  </svg>`,

  devil: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#240A10"/>
    <!-- Left Horn -->
    <path d="M42 80 C40 50 56 34 68 28 C64 42 54 62 58 82 Z" fill="#E11D48" stroke="#BE123C" stroke-width="2"/>
    <!-- Right Horn -->
    <path d="M118 80 C120 50 104 34 92 28 C96 42 106 62 102 82 Z" fill="#E11D48" stroke="#BE123C" stroke-width="2"/>
    <!-- Glow Highlights -->
    <path d="M46 72 C48 56 58 42 66 32" stroke="#FDA4AF" stroke-width="2" fill="none"/>
    <path d="M114 72 C112 56 102 42 94 32" stroke="#FDA4AF" stroke-width="2" fill="none"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FB7185">Devil</text>
  </svg>`,

  angel: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#1C1E2E"/>
    <!-- Halo -->
    <ellipse cx="80" cy="45" rx="36" ry="12" fill="none" stroke="#FDE047" stroke-width="6"/>
    <!-- Wings -->
    <path d="M42 78 C20 60 18 90 34 104 C46 96 48 84 42 78 Z" fill="#F8FAFC" opacity="0.9"/>
    <path d="M118 78 C140 60 142 90 126 104 C114 96 112 84 118 78 Z" fill="#F8FAFC" opacity="0.9"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FDE047">Angel</text>
  </svg>`,

  birthday: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#25142E"/>
    <!-- Party Hat Cone -->
    <polygon points="80,26 44,98 116,98" fill="#EC4899"/>
    <!-- Stripes -->
    <polygon points="80,26 68,58 92,58" fill="#FBBF24"/>
    <polygon points="56,76 104,76 96,88 64,88" fill="#00D2FF"/>
    <!-- Pom-Pom -->
    <circle cx="80" cy="24" r="8" fill="#FDE047"/>
    <!-- Confetti -->
    <rect x="30" y="50" width="5" height="10" fill="#22C55E" transform="rotate(30 30 50)"/>
    <rect x="125" y="45" width="5" height="10" fill="#F59E0B" transform="rotate(-40 125 45)"/>
    <circle cx="38" cy="80" r="3" fill="#EC4899"/>
    <circle cx="124" cy="78" r="3" fill="#00D2FF"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#F472B6">Birthday</text>
  </svg>`,

  'robot-face': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#0F172A"/>
    <!-- Metallic Plates -->
    <polygon points="80,38 122,50 120,108 80,122" fill="#334155" stroke="#00F0FF" stroke-width="2"/>
    <!-- Cyborg Red Eye HUD -->
    <circle cx="102" cy="74" r="12" fill="#1E293B" stroke="#EF4444" stroke-width="3"/>
    <circle cx="102" cy="74" r="5" fill="#EF4444"/>
    <!-- Circuit lines -->
    <line x1="86" y1="92" x2="114" y2="92" stroke="#00F0FF" stroke-width="2"/>
    <line x1="94" y1="92" x2="94" y2="108" stroke="#00F0FF" stroke-width="2"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#38BDF8">Robot</text>
  </svg>`,

  'galaxy-face': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#08071A"/>
    <!-- Cosmic Nebula -->
    <ellipse cx="80" cy="75" rx="46" ry="32" fill="#7C3AED" opacity="0.6"/>
    <ellipse cx="74" cy="78" rx="32" ry="22" fill="#EC4899" opacity="0.5"/>
    <!-- Crescent Moon -->
    <path d="M80 44 C88 44 94 50 94 58 C94 66 88 72 80 72 C78 72 76 71 74 70 C80 66 82 58 78 52 C76 48 80 44 80 44 Z" fill="#FDE047"/>
    <!-- Stars -->
    <circle cx="50" cy="65" r="2" fill="#FFFFFF"/>
    <circle cx="110" cy="62" r="2" fill="#FFFFFF"/>
    <circle cx="62" cy="90" r="1.5" fill="#FFFFFF"/>
    <circle cx="98" cy="92" r="1.5" fill="#FFFFFF"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#C084FC">Galaxy</text>
  </svg>`,

  // === BEAUTY PRESETS ===
  'yaro-beauty': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#2E1228"/>
    <!-- Sparkling Diamond -->
    <polygon points="80,36 104,56 80,94 56,56" fill="#F43F5E"/>
    <polygon points="80,36 94,56 80,94 66,56" fill="#FDA4AF"/>
    <!-- Golden Sparkles -->
    <path d="M40 46 L43 54 L51 57 L43 60 L40 68 L37 60 L29 57 L37 54 Z" fill="#FDE047"/>
    <path d="M120 42 L123 50 L131 53 L123 56 L120 64 L117 56 L109 53 L117 50 Z" fill="#FDE047"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#F472B6">Yaro Beauty</text>
  </svg>`,

  'natural-skin': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#14241B"/>
    <!-- Water Drop -->
    <path d="M80 38 C80 38 54 74 54 94 C54 108 66 118 80 118 C94 118 106 108 106 94 C106 74 80 38 80 38 Z" fill="#34D399"/>
    <!-- Leaf Accent -->
    <path d="M80 62 C90 70 94 84 88 96" stroke="#FFFFFF" stroke-width="2.5" fill="none"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#6EE7B7">Natural Skin</text>
  </svg>`,

  'smooth-skin': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#291A24"/>
    <!-- Silk Wave -->
    <path d="M30 84 Q55 54 80 84 Q105 114 130 84" fill="none" stroke="#F472B6" stroke-width="6" stroke-linecap="round"/>
    <path d="M36 94 Q61 64 86 94 Q111 124 136 94" fill="none" stroke="#FBCFE8" stroke-width="3" stroke-linecap="round"/>
    <!-- Sparkles -->
    <circle cx="50" cy="56" r="3" fill="#FDE047"/>
    <circle cx="110" cy="62" r="4" fill="#FDE047"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#F472B6">Smooth Skin</text>
  </svg>`,

  'pink-glow': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#2E1220"/>
    <!-- Glowing concentric circles -->
    <circle cx="80" cy="74" r="38" fill="#F43F5E" opacity="0.2"/>
    <circle cx="80" cy="74" r="28" fill="#FB7185" opacity="0.4"/>
    <circle cx="80" cy="74" r="18" fill="#FDA4AF" opacity="0.8"/>
    <circle cx="80" cy="74" r="8" fill="#FFFFFF"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FB7185">Pink Glow</text>
  </svg>`,

  'golden-shine': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#291E0D"/>
    <!-- Sunburst Radiance -->
    <circle cx="80" cy="74" r="20" fill="#F59E0B"/>
    <line x1="80" y1="36" x2="80" y2="46" stroke="#FDE047" stroke-width="4" stroke-linecap="round"/>
    <line x1="80" y1="102" x2="80" y2="112" stroke="#FDE047" stroke-width="4" stroke-linecap="round"/>
    <line x1="42" y1="74" x2="52" y2="74" stroke="#FDE047" stroke-width="4" stroke-linecap="round"/>
    <line x1="108" y1="74" x2="118" y2="74" stroke="#FDE047" stroke-width="4" stroke-linecap="round"/>
    <line x1="54" y1="48" x2="62" y2="56" stroke="#FDE047" stroke-width="3" stroke-linecap="round"/>
    <line x1="106" y1="48" x2="98" y2="56" stroke="#FDE047" stroke-width="3" stroke-linecap="round"/>
    <line x1="54" y1="100" x2="62" y2="92" stroke="#FDE047" stroke-width="3" stroke-linecap="round"/>
    <line x1="106" y1="100" x2="98" y2="92" stroke="#FDE047" stroke-width="3" stroke-linecap="round"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FBBF24">Golden Shine</text>
  </svg>`,

  'rosy-cheeks': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#2E1220"/>
    <!-- Face Silhouette -->
    <ellipse cx="80" cy="78" rx="38" ry="34" fill="#FFE4E6"/>
    <!-- Rosy Cheek Blushes -->
    <circle cx="56" cy="84" r="14" fill="#F43F5E" opacity="0.6"/>
    <circle cx="104" cy="84" r="14" fill="#F43F5E" opacity="0.6"/>
    <!-- Smile -->
    <path d="M72 88 Q80 94 88 88" stroke="#E11D48" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FB7185">Rosy Cheeks</text>
  </svg>`,

  'soft-makeup': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#291428"/>
    <!-- Winged Eye Liner -->
    <path d="M40 70 Q55 60 70 70" stroke="#1F2937" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M70 70 Q76 64 80 62" stroke="#1F2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <!-- Lipstick tube -->
    <rect x="94" y="68" width="18" height="38" rx="3" fill="#1F2937"/>
    <path d="M97 68 L109 68 L109 50 L97 58 Z" fill="#E11D48"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#F472B6">Soft Makeup</text>
  </svg>`,

  'bright-eyes': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#0F172A"/>
    <!-- Eye Shape -->
    <path d="M40 76 Q80 50 120 76 Q80 102 40 76 Z" fill="#FFFFFF"/>
    <!-- Iris -->
    <circle cx="80" cy="76" r="16" fill="#38BDF8"/>
    <circle cx="80" cy="76" r="8" fill="#0F172A"/>
    <!-- Twinkle Highlights -->
    <circle cx="75" cy="71" r="4" fill="#FFFFFF"/>
    <circle cx="86" cy="81" r="2" fill="#FFFFFF"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#38BDF8">Bright Eyes</text>
  </svg>`,

  'lip-tint': `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#2E0E18"/>
    <!-- Plump Glossy Lips -->
    <path d="M42 80 Q62 66 80 72 Q98 66 118 80 Q98 98 80 98 Q62 98 42 80 Z" fill="#E11D48"/>
    <path d="M42 80 Q62 82 80 82 Q98 82 118 80 Q98 106 80 106 Q62 106 42 80 Z" fill="#BE123C"/>
    <!-- Gloss Shine Highlight -->
    <ellipse cx="76" cy="76" rx="8" ry="3" fill="#FFFFFF" opacity="0.7"/>
    <ellipse cx="80" cy="94" rx="12" ry="3.5" fill="#FFFFFF" opacity="0.5"/>
    <text x="80" y="146" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FB7185">Lip Tint</text>
  </svg>`,
};

export function getEffectThumbnail(id: string): string | undefined {
  if (THUMBNAILS[id]) {
    return THUMBNAILS[id];
  }
  // Fallbacks for category matches:
  if (id.includes('puppy') || id.includes('dog')) return THUMBNAILS.puppy;
  if (id.includes('cat') || id.includes('kitty')) return THUMBNAILS.kitty;
  if (id.includes('bunny') || id.includes('rabbit')) return THUMBNAILS.bunny;
  if (id.includes('fox')) return THUMBNAILS.fox;
  if (id.includes('panda')) return THUMBNAILS.panda;
  if (id.includes('crown') || id.includes('royal')) return THUMBNAILS['royal-crown'];
  if (id.includes('glass')) return THUMBNAILS['heart-glasses'];
  if (id.includes('headset') || id.includes('cyber')) return THUMBNAILS['cyber-headset'];
  if (id.includes('cry') || id.includes('tear')) return THUMBNAILS['cry-baby'];
  if (id.includes('heart') || id.includes('love')) return THUMBNAILS['love-hearts'];
  if (id.includes('fire') || id.includes('flame')) return THUMBNAILS['flame-face'];
  if (id.includes('flower')) return THUMBNAILS['flower-crown'];
  if (id.includes('butterfl')) return THUMBNAILS.butterflies;
  if (id.includes('devil') || id.includes('horn')) return THUMBNAILS.devil;
  if (id.includes('angel') || id.includes('halo')) return THUMBNAILS.angel;
  if (id.includes('birth') || id.includes('party')) return THUMBNAILS.birthday;
  if (id.includes('robot')) return THUMBNAILS['robot-face'];
  if (id.includes('galaxy') || id.includes('space')) return THUMBNAILS['galaxy-face'];
  if (id.includes('blush') || id.includes('rosy')) return THUMBNAILS['rosy-cheeks'];
  if (id.includes('lip')) return THUMBNAILS['lip-tint'];
  if (id.includes('eye')) return THUMBNAILS['bright-eyes'];
  if (id.includes('glow')) return THUMBNAILS['pink-glow'];
  if (id.includes('shine') || id.includes('gold')) return THUMBNAILS['golden-shine'];
  if (id.includes('makeup')) return THUMBNAILS['soft-makeup'];
  if (id.includes('smooth')) return THUMBNAILS['smooth-skin'];
  if (id.includes('natural')) return THUMBNAILS['natural-skin'];
  if (id.includes('beauty')) return THUMBNAILS['yaro-beauty'];
  return undefined;
}
