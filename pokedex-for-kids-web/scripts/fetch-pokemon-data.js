/**
 * 從 PokéAPI 抓取寶可夢資料並儲存為 JSON
 * 執行: node scripts/fetch-pokemon-data.js
 */

const fs = require('fs');
const path = require('path');

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const OUTPUT_DIR = path.join(__dirname, '../public/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'pokemon.json');
const TOTAL_POKEMON = 151; // 先抓取第一代 151 隻（可調整）

// 中文名稱對照表（第一代）
const chineseNames = {
  'bulbasaur': '妙蛙種子',
  'ivysaur': '妙蛙草',
  'venusaur': '妙蛙花',
  'charmander': '小火龍',
  'charmeleon': '火恐龍',
  'charizard': '噴火龍',
  'squirtle': '傑尼龜',
  'wartortle': '卡咪龜',
  'blastoise': '水箭龜',
  'caterpie': '綠毛蟲',
  'metapod': '鐵甲蛹',
  'butterfree': '巴大蝶',
  'weedle': '獨角蟲',
  'kakuna': '鐵殼蛹',
  'beedrill': '大針蜂',
  'pidgey': '波波',
  'pidgeotto': '比比鳥',
  'pidgeot': '大比鳥',
  'rattata': '小拉達',
  'raticate': '拉達',
  'spearow': '烈雀',
  'fearow': '大嘴雀',
  'ekans': '阿柏蛇',
  'arbok': '阿柏怪',
  'pikachu': '皮卡丘',
  'raichu': '雷丘',
  'sandshrew': '穿山鼠',
  'sandslash': '穿山王',
  'nidoran-f': '尼多蘭',
  'nidorina': '尼多娜',
  'nidoqueen': '尼多后',
  'nidoran-m': '尼多朗',
  'nidorino': '尼多力諾',
  'nidoking': '尼多王',
  'clefairy': '皮皮',
  'clefable': '皮可西',
  'vulpix': '六尾',
  'ninetales': '九尾',
  'jigglypuff': '胖丁',
  'wigglytuff': '胖可丁',
  'zubat': '超音蝠',
  'golbat': '大嘴蝠',
  'oddish': '走路草',
  'gloom': '臭臭花',
  'vileplume': '霸王花',
  'paras': '派拉斯',
  'parasect': '派拉斯特',
  'venonat': '毛球',
  'venomoth': '摩魯蛾',
  'diglett': '地鼠',
  'dugtrio': '三地鼠',
  'meowth': '喵喵',
  'persian': '貓老大',
  'psyduck': '可達鴨',
  'golduck': '哥達鴨',
  'mankey': '猴怪',
  'primeape': '火爆猴',
  'growlithe': '卡蒂狗',
  'arcanine': '風速狗',
  'poliwag': '蚊香蝌蚪',
  'poliwhirl': '蚊香君',
  'poliwrath': '蚊香泳士',
  'abra': '凱西',
  'kadabra': '勇基拉',
  'alakazam': '胡地',
  'machop': '腕力',
  'machoke': '豪力',
  'machamp': '怪力',
  'bellsprout': '喇叭芽',
  'weepinbell': '口呆花',
  'victreebel': '大食花',
  'tentacool': '瑪瑙水母',
  'tentacruel': '毒刺水母',
  'geodude': '小拳石',
  'graveler': '隆隆石',
  'golem': '隆隆岩',
  'ponyta': '小火馬',
  'rapidash': '烈焰馬',
  'slowpoke': '呆呆獸',
  'slowbro': '呆殼獸',
  'magnemite': '小磁怪',
  'magneton': '三合一磁怪',
  'farfetchd': '大蔥鴨',
  'doduo': '嘟嘟',
  'dodrio': '嘟嘟利',
  'seel': '小海獅',
  'dewgong': '白海獅',
  'grimer': '臭泥',
  'muk': '臭臭泥',
  'shellder': '大舌貝',
  'cloyster': '刺甲貝',
  'gastly': '鬼斯',
  'haunter': '鬼斯通',
  'gengar': '耿鬼',
  'onix': '大岩蛇',
  'drowzee': '催眠貘',
  'hypno': '引夢貘人',
  'krabby': '大鉗蟹',
  'kingler': '巨鉗蟹',
  'voltorb': '霹靂電球',
  'electrode': '頑皮雷彈',
  'exeggcute': '蛋蛋',
  'exeggutor': '椰蛋樹',
  'cubone': '卡拉卡拉',
  'marowak': '嘎拉嘎拉',
  'hitmonlee': '飛腿郎',
  'hitmonchan': '快拳郎',
  'lickitung': '大舌頭',
  'koffing': '瓦斯彈',
  'weezing': '雙彈瓦斯',
  'rhyhorn': '獨角犀牛',
  'rhydon': '鑽角犀獸',
  'chansey': '吉利蛋',
  'tangela': '蔓藤怪',
  'kangaskhan': '袋獸',
  'horsea': '墨海馬',
  'seadra': '海刺龍',
  'goldeen': '角金魚',
  'seaking': '金魚王',
  'staryu': '海星星',
  'starmie': '寶石海星',
  'mr-mime': '魔牆人偶',
  'scyther': '飛天螳螂',
  'jynx': '迷唇姐',
  'electabuzz': '電擊獸',
  'magmar': '鴨嘴火獸',
  'pinsir': '凱羅斯',
  'tauros': '肯泰羅',
  'magikarp': '鯉魚王',
  'gyarados': '暴鯉龍',
  'lapras': '拉普拉斯',
  'ditto': '百變怪',
  'eevee': '伊布',
  'vaporeon': '水伊布',
  'jolteon': '雷伊布',
  'flareon': '火伊布',
  'porygon': '多邊獸',
  'omanyte': '菊石獸',
  'omastar': '多刺菊石獸',
  'kabuto': '化石盔',
  'kabutops': '鐮刀盔',
  'aerodactyl': '化石翼龍',
  'snorlax': '卡比獸',
  'articuno': '急凍鳥',
  'zapdos': '閃電鳥',
  'moltres': '火焰鳥',
  'dratini': '迷你龍',
  'dragonair': '哈克龍',
  'dragonite': '快龍',
  'mewtwo': '超夢',
  'mew': '夢幻',
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`重試 ${i + 1}/${retries}: ${url}`);
      await delay(1000 * (i + 1));
    }
  }
}

function formatDexNumber(id) {
  return id.toString().padStart(3, '0');
}

function getChineseName(englishName) {
  return chineseNames[englishName.toLowerCase()] || englishName;
}

async function fetchPokemon(id) {
  try {
    const data = await fetchWithRetry(`${POKEAPI_BASE_URL}/pokemon/${id}`);

    const englishName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    const chineseName = getChineseName(data.name);

    return {
      id: data.id,
      name: {
        en: englishName,
        zh: chineseName,
      },
      dexNumber: formatDexNumber(data.id),
      sprites: {
        official: data.sprites.other?.['official-artwork']?.front_default ||
                  data.sprites.front_default ||
                  '',
        icon: data.sprites.front_default || '',
      },
      metadata: {
        generation: data.id <= 151 ? 1 : Math.ceil(data.id / 100),
        isSpecialForm: data.name.includes('-'),
      },
    };
  } catch (error) {
    console.error(`抓取 Pokemon ${id} 失敗:`, error.message);
    return null;
  }
}

async function fetchAllPokemon() {
  console.log(`開始抓取 ${TOTAL_POKEMON} 隻寶可夢資料...`);

  const pokemon = [];
  const batchSize = 10;

  for (let i = 1; i <= TOTAL_POKEMON; i += batchSize) {
    const batch = [];
    const end = Math.min(i + batchSize - 1, TOTAL_POKEMON);

    console.log(`正在抓取 ${i}-${end}...`);

    for (let j = i; j <= end; j++) {
      batch.push(fetchPokemon(j));
    }

    const results = await Promise.all(batch);
    pokemon.push(...results.filter(p => p !== null));

    // 避免請求過於頻繁
    if (i + batchSize <= TOTAL_POKEMON) {
      await delay(500);
    }
  }

  console.log(`成功抓取 ${pokemon.length} 隻寶可夢！`);
  return pokemon;
}

async function main() {
  try {
    // 確保輸出目錄存在
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 抓取資料
    const pokemon = await fetchAllPokemon();

    // 儲存為 JSON
    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(pokemon, null, 2),
      'utf-8'
    );

    console.log(`✅ 資料已儲存至: ${OUTPUT_FILE}`);
    console.log(`檔案大小: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ 發生錯誤:', error);
    process.exit(1);
  }
}

main();
