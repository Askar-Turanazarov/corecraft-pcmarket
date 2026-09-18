// demandX — какой gpuScore нужен для 60 FPS в 1080p на пресете X (без RT и апскейла), RTX 4090 = 100.
// cpuDemand — какой cpuScore нужен для 60 FPS, когда упираемся в процессор, Ryzen 7 9800X3D = 100.
// Числа — усреднение обзоров (TechPowerUp, HUB, GN) в самой тяжёлой типичной сцене.

export type SeedGame = {
  slug: string
  titleRu: string; titleUz: string; titleEn: string
  year: number
  engine: string | null
  genre: string
  coverUrl: null
  demandLow: number; demandMedium: number; demandHigh: number; demandUltra: number
  cpuDemand: number
  vramLow: number; vramMedium: number; vramHigh: number; vramUltra: number
  rtCost: number
  supportsRt: boolean
  supportsUpscaling: boolean
}

export const games: SeedGame[] = [
  { slug: 'cyberpunk-2077', titleRu: 'Cyberpunk 2077', titleUz: 'Cyberpunk 2077', titleEn: 'Cyberpunk 2077', year: 2020, engine: 'REDengine 4', genre: 'rpg', coverUrl: null,
    demandLow: 18, demandMedium: 24, demandHigh: 32, demandUltra: 40, cpuDemand: 30,
    vramLow: 6, vramMedium: 7, vramHigh: 8, vramUltra: 9.5, rtCost: 2.2, supportsRt: true, supportsUpscaling: true },
  { slug: 'alan-wake-2', titleRu: 'Alan Wake 2', titleUz: 'Alan Wake 2', titleEn: 'Alan Wake 2', year: 2023, engine: 'Northlight', genre: 'horror', coverUrl: null,
    demandLow: 26, demandMedium: 34, demandHigh: 44, demandUltra: 55, cpuDemand: 25,
    vramLow: 6, vramMedium: 7.5, vramHigh: 9, vramUltra: 11, rtCost: 1.9, supportsRt: true, supportsUpscaling: true },
  { slug: 'black-myth-wukong', titleRu: 'Black Myth: Wukong', titleUz: 'Black Myth: Wukong', titleEn: 'Black Myth: Wukong', year: 2024, engine: 'Unreal Engine 5', genre: 'action', coverUrl: null,
    demandLow: 26, demandMedium: 35, demandHigh: 46, demandUltra: 60, cpuDemand: 32,
    vramLow: 6, vramMedium: 7, vramHigh: 8.5, vramUltra: 10, rtCost: 2.3, supportsRt: true, supportsUpscaling: true },
  // Lumen только программный, аппаратного RT в настройках нет
  { slug: 'stalker-2', titleRu: 'S.T.A.L.K.E.R. 2: Сердце Чернобыля', titleUz: 'S.T.A.L.K.E.R. 2: Heart of Chornobyl', titleEn: 'S.T.A.L.K.E.R. 2: Heart of Chornobyl', year: 2024, engine: 'Unreal Engine 5', genre: 'shooter', coverUrl: null,
    demandLow: 26, demandMedium: 34, demandHigh: 46, demandUltra: 60, cpuDemand: 55,
    vramLow: 6, vramMedium: 7.5, vramHigh: 9, vramUltra: 10.5, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'hellblade-2', titleRu: "Senua's Saga: Hellblade II", titleUz: "Senua's Saga: Hellblade II", titleEn: "Senua's Saga: Hellblade II", year: 2024, engine: 'Unreal Engine 5', genre: 'action', coverUrl: null,
    demandLow: 28, demandMedium: 36, demandHigh: 46, demandUltra: 57, cpuDemand: 22,
    vramLow: 6, vramMedium: 7, vramHigh: 8, vramUltra: 9.5, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  // В городах упирается в CPU даже на топовых процессорах
  { slug: 'dragons-dogma-2', titleRu: "Dragon's Dogma 2", titleUz: "Dragon's Dogma 2", titleEn: "Dragon's Dogma 2", year: 2024, engine: 'RE Engine', genre: 'rpg', coverUrl: null,
    demandLow: 20, demandMedium: 27, demandHigh: 36, demandUltra: 46, cpuDemand: 75,
    vramLow: 6, vramMedium: 7, vramHigh: 8.5, vramUltra: 10, rtCost: 1.3, supportsRt: true, supportsUpscaling: true },
  // RT-освещение обязательно и уже заложено в demand; rtCost — только за RTXDI
  { slug: 'star-wars-outlaws', titleRu: 'Star Wars Outlaws', titleUz: 'Star Wars Outlaws', titleEn: 'Star Wars Outlaws', year: 2024, engine: 'Snowdrop', genre: 'action', coverUrl: null,
    demandLow: 24, demandMedium: 33, demandHigh: 44, demandUltra: 57, cpuDemand: 35,
    vramLow: 6, vramMedium: 8, vramHigh: 9.5, vramUltra: 11, rtCost: 1.35, supportsRt: true, supportsUpscaling: true },
  { slug: 'starfield', titleRu: 'Starfield', titleUz: 'Starfield', titleEn: 'Starfield', year: 2023, engine: 'Creation Engine 2', genre: 'rpg', coverUrl: null,
    demandLow: 22, demandMedium: 30, demandHigh: 42, demandUltra: 52, cpuDemand: 48,
    vramLow: 5, vramMedium: 6.5, vramHigh: 8, vramUltra: 9, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'microsoft-flight-simulator-2024', titleRu: 'Microsoft Flight Simulator 2024', titleUz: 'Microsoft Flight Simulator 2024', titleEn: 'Microsoft Flight Simulator 2024', year: 2024, engine: 'Asobo Engine', genre: 'simulator', coverUrl: null,
    demandLow: 28, demandMedium: 38, demandHigh: 52, demandUltra: 67, cpuDemand: 75,
    vramLow: 6, vramMedium: 8, vramHigh: 10, vramUltra: 12, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  // cpuDemand для крупного города (100k+ жителей), на старте игры легче
  { slug: 'cities-skylines-2', titleRu: 'Cities: Skylines II', titleUz: 'Cities: Skylines II', titleEn: 'Cities: Skylines II', year: 2023, engine: 'Unity', genre: 'strategy', coverUrl: null,
    demandLow: 26, demandMedium: 38, demandHigh: 52, demandUltra: 67, cpuDemand: 90,
    vramLow: 5, vramMedium: 6, vramHigh: 7.5, vramUltra: 9, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'monster-hunter-wilds', titleRu: 'Monster Hunter Wilds', titleUz: 'Monster Hunter Wilds', titleEn: 'Monster Hunter Wilds', year: 2025, engine: 'RE Engine', genre: 'action', coverUrl: null,
    demandLow: 24, demandMedium: 32, demandHigh: 44, demandUltra: 57, cpuDemand: 55,
    vramLow: 6, vramMedium: 8, vramHigh: 10, vramUltra: 12, rtCost: 1.25, supportsRt: true, supportsUpscaling: true },
  // Глобальное освещение SVOGI программное, аппаратного RT нет
  { slug: 'kingdom-come-deliverance-2', titleRu: 'Kingdom Come: Deliverance II', titleUz: 'Kingdom Come: Deliverance II', titleEn: 'Kingdom Come: Deliverance II', year: 2025, engine: 'CryEngine', genre: 'rpg', coverUrl: null,
    demandLow: 17, demandMedium: 23, demandHigh: 31, demandUltra: 40, cpuDemand: 40,
    vramLow: 4.5, vramMedium: 5.5, vramHigh: 7, vramUltra: 8, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  // RT обязателен и заложен в demand; rtCost — опция Full RT. Очень прожорлива по VRAM (texture pool)
  { slug: 'indiana-jones-great-circle', titleRu: 'Indiana Jones and the Great Circle', titleUz: 'Indiana Jones and the Great Circle', titleEn: 'Indiana Jones and the Great Circle', year: 2024, engine: 'id Tech 7', genre: 'action', coverUrl: null,
    demandLow: 18, demandMedium: 24, demandHigh: 31, demandUltra: 38, cpuDemand: 28,
    vramLow: 8, vramMedium: 9.5, vramHigh: 11, vramUltra: 13, rtCost: 1.2, supportsRt: true, supportsUpscaling: true },
  { slug: 'space-marine-2', titleRu: 'Warhammer 40,000: Space Marine 2', titleUz: 'Warhammer 40,000: Space Marine 2', titleEn: 'Warhammer 40,000: Space Marine 2', year: 2024, engine: 'Swarm Engine', genre: 'action', coverUrl: null,
    demandLow: 19, demandMedium: 26, demandHigh: 34, demandUltra: 43, cpuDemand: 46,
    vramLow: 5, vramMedium: 6, vramHigh: 7.5, vramUltra: 9, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'silent-hill-2', titleRu: 'Silent Hill 2', titleUz: 'Silent Hill 2', titleEn: 'Silent Hill 2', year: 2024, engine: 'Unreal Engine 5', genre: 'horror', coverUrl: null,
    demandLow: 24, demandMedium: 33, demandHigh: 43, demandUltra: 55, cpuDemand: 35,
    vramLow: 6, vramMedium: 7, vramHigh: 8.5, vramUltra: 10, rtCost: 1.3, supportsRt: true, supportsUpscaling: true },
  { slug: 'red-dead-redemption-2', titleRu: 'Red Dead Redemption 2', titleUz: 'Red Dead Redemption 2', titleEn: 'Red Dead Redemption 2', year: 2019, engine: 'RAGE', genre: 'action', coverUrl: null,
    demandLow: 14, demandMedium: 20, demandHigh: 27, demandUltra: 35, cpuDemand: 30,
    vramLow: 3.5, vramMedium: 4.5, vramHigh: 5.5, vramUltra: 7, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'hogwarts-legacy', titleRu: 'Hogwarts Legacy', titleUz: 'Hogwarts Legacy', titleEn: 'Hogwarts Legacy', year: 2023, engine: 'Unreal Engine 4', genre: 'rpg', coverUrl: null,
    demandLow: 16, demandMedium: 22, demandHigh: 30, demandUltra: 38, cpuDemand: 46,
    vramLow: 5, vramMedium: 6.5, vramHigh: 8, vramUltra: 10, rtCost: 1.8, supportsRt: true, supportsUpscaling: true },
  // Кадры залочены на 60 — модель считает «потолок без лока». Апскейлеров в игре нет
  { slug: 'elden-ring', titleRu: 'Elden Ring', titleUz: 'Elden Ring', titleEn: 'Elden Ring', year: 2022, engine: 'FromSoftware Engine', genre: 'rpg', coverUrl: null,
    demandLow: 13, demandMedium: 18, demandHigh: 24, demandUltra: 30, cpuDemand: 25,
    vramLow: 3.5, vramMedium: 4.5, vramHigh: 5.5, vramUltra: 6.5, rtCost: 1.4, supportsRt: true, supportsUpscaling: false },
  // Акт 3 (Нижний Город) сильно грузит CPU
  { slug: 'baldurs-gate-3', titleRu: "Baldur's Gate 3", titleUz: "Baldur's Gate 3", titleEn: "Baldur's Gate 3", year: 2023, engine: 'Divinity 4.0', genre: 'rpg', coverUrl: null,
    demandLow: 12, demandMedium: 17, demandHigh: 23, demandUltra: 30, cpuDemand: 55,
    vramLow: 4, vramMedium: 5, vramHigh: 6, vramUltra: 7.5, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'counter-strike-2', titleRu: 'Counter-Strike 2', titleUz: 'Counter-Strike 2', titleEn: 'Counter-Strike 2', year: 2023, engine: 'Source 2', genre: 'shooter', coverUrl: null,
    demandLow: 5, demandMedium: 7, demandHigh: 9, demandUltra: 11, cpuDemand: 10,
    vramLow: 2.5, vramMedium: 3, vramHigh: 3.5, vramUltra: 4, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'valorant', titleRu: 'Valorant', titleUz: 'Valorant', titleEn: 'Valorant', year: 2020, engine: 'Unreal Engine 4', genre: 'shooter', coverUrl: null,
    demandLow: 2.5, demandMedium: 3.5, demandHigh: 5, demandUltra: 6.5, cpuDemand: 7,
    vramLow: 1.5, vramMedium: 2, vramHigh: 2.5, vramUltra: 3, rtCost: 1, supportsRt: false, supportsUpscaling: false },
  // Low = режим Performance, Ultra = Epic с Nanite/Lumen — разрыв больше обычного
  { slug: 'fortnite', titleRu: 'Fortnite', titleUz: 'Fortnite', titleEn: 'Fortnite', year: 2017, engine: 'Unreal Engine 5', genre: 'battleRoyale', coverUrl: null,
    demandLow: 12, demandMedium: 18, demandHigh: 28, demandUltra: 40, cpuDemand: 30,
    vramLow: 3, vramMedium: 4, vramHigh: 6, vramUltra: 8, rtCost: 1.4, supportsRt: true, supportsUpscaling: true },
  { slug: 'apex-legends', titleRu: 'Apex Legends', titleUz: 'Apex Legends', titleEn: 'Apex Legends', year: 2019, engine: 'Source', genre: 'battleRoyale', coverUrl: null,
    demandLow: 8, demandMedium: 11, demandHigh: 14, demandUltra: 17, cpuDemand: 22,
    vramLow: 3, vramMedium: 4, vramHigh: 5.5, vramUltra: 7, rtCost: 1, supportsRt: false, supportsUpscaling: false },
  { slug: 'pubg-battlegrounds', titleRu: 'PUBG: Battlegrounds', titleUz: 'PUBG: Battlegrounds', titleEn: 'PUBG: Battlegrounds', year: 2017, engine: 'Unreal Engine 4', genre: 'battleRoyale', coverUrl: null,
    demandLow: 8, demandMedium: 12, demandHigh: 16, demandUltra: 20, cpuDemand: 22,
    vramLow: 2.5, vramMedium: 3, vramHigh: 4, vramUltra: 5, rtCost: 1, supportsRt: false, supportsUpscaling: false },
  // Карта Streets упирается в CPU и объём RAM
  { slug: 'escape-from-tarkov', titleRu: 'Escape from Tarkov', titleUz: 'Escape from Tarkov', titleEn: 'Escape from Tarkov', year: 2017, engine: 'Unity', genre: 'shooter', coverUrl: null,
    demandLow: 14, demandMedium: 19, demandHigh: 24, demandUltra: 30, cpuDemand: 65,
    vramLow: 4, vramMedium: 5, vramHigh: 6.5, vramUltra: 8, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'helldivers-2', titleRu: 'Helldivers 2', titleUz: 'Helldivers 2', titleEn: 'Helldivers 2', year: 2024, engine: 'Autodesk Stingray', genre: 'shooter', coverUrl: null,
    demandLow: 17, demandMedium: 24, demandHigh: 31, demandUltra: 40, cpuDemand: 46,
    vramLow: 4, vramMedium: 5, vramHigh: 6.5, vramUltra: 8, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'marvel-rivals', titleRu: 'Marvel Rivals', titleUz: 'Marvel Rivals', titleEn: 'Marvel Rivals', year: 2024, engine: 'Unreal Engine 5', genre: 'shooter', coverUrl: null,
    demandLow: 13, demandMedium: 18, demandHigh: 25, demandUltra: 33, cpuDemand: 28,
    vramLow: 4, vramMedium: 5, vramHigh: 6.5, vramUltra: 8, rtCost: 1.5, supportsRt: true, supportsUpscaling: true },
  // Next-gen версия 4.0: Новиград заметно грузит CPU
  { slug: 'witcher-3', titleRu: 'Ведьмак 3: Дикая Охота', titleUz: 'The Witcher 3: Wild Hunt', titleEn: 'The Witcher 3: Wild Hunt', year: 2015, engine: 'REDengine 3', genre: 'rpg', coverUrl: null,
    demandLow: 12, demandMedium: 18, demandHigh: 25, demandUltra: 33, cpuDemand: 35,
    vramLow: 3.5, vramMedium: 4.5, vramHigh: 6, vramUltra: 8, rtCost: 2.3, supportsRt: true, supportsUpscaling: true },
  { slug: 'gta-v-enhanced', titleRu: 'Grand Theft Auto V Enhanced', titleUz: 'Grand Theft Auto V Enhanced', titleEn: 'Grand Theft Auto V Enhanced', year: 2025, engine: 'RAGE', genre: 'action', coverUrl: null,
    demandLow: 9, demandMedium: 14, demandHigh: 19, demandUltra: 24, cpuDemand: 32,
    vramLow: 3, vramMedium: 4, vramHigh: 5, vramUltra: 6.5, rtCost: 1.5, supportsRt: true, supportsUpscaling: true },
  { slug: 'forza-horizon-5', titleRu: 'Forza Horizon 5', titleUz: 'Forza Horizon 5', titleEn: 'Forza Horizon 5', year: 2021, engine: 'ForzaTech', genre: 'racing', coverUrl: null,
    demandLow: 12, demandMedium: 17, demandHigh: 23, demandUltra: 30, cpuDemand: 25,
    vramLow: 4, vramMedium: 5, vramHigh: 6.5, vramUltra: 8, rtCost: 1.3, supportsRt: true, supportsUpscaling: true },
  { slug: 'call-of-duty-black-ops-6', titleRu: 'Call of Duty: Black Ops 6', titleUz: 'Call of Duty: Black Ops 6', titleEn: 'Call of Duty: Black Ops 6', year: 2024, engine: 'IW Engine', genre: 'shooter', coverUrl: null,
    demandLow: 11, demandMedium: 15, demandHigh: 21, demandUltra: 27, cpuDemand: 22,
    vramLow: 4.5, vramMedium: 6, vramHigh: 8, vramUltra: 10, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  // Большие карты на 64 игрока — упор в CPU
  { slug: 'battlefield-6', titleRu: 'Battlefield 6', titleUz: 'Battlefield 6', titleEn: 'Battlefield 6', year: 2025, engine: 'Frostbite', genre: 'shooter', coverUrl: null,
    demandLow: 12, demandMedium: 17, demandHigh: 23, demandUltra: 30, cpuDemand: 38,
    vramLow: 4, vramMedium: 5, vramHigh: 6.5, vramUltra: 8, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'assassins-creed-shadows', titleRu: "Assassin's Creed Shadows", titleUz: "Assassin's Creed Shadows", titleEn: "Assassin's Creed Shadows", year: 2025, engine: 'Anvil', genre: 'action', coverUrl: null,
    demandLow: 24, demandMedium: 32, demandHigh: 43, demandUltra: 55, cpuDemand: 38,
    vramLow: 6, vramMedium: 7.5, vramHigh: 9, vramUltra: 11, rtCost: 1.45, supportsRt: true, supportsUpscaling: true },
  // RT обязателен и заложен в demand; rtCost — опция трассировки пути
  { slug: 'doom-the-dark-ages', titleRu: 'Doom: The Dark Ages', titleUz: 'Doom: The Dark Ages', titleEn: 'Doom: The Dark Ages', year: 2025, engine: 'id Tech 8', genre: 'shooter', coverUrl: null,
    demandLow: 20, demandMedium: 26, demandHigh: 33, demandUltra: 40, cpuDemand: 25,
    vramLow: 6, vramMedium: 7, vramHigh: 8.5, vramUltra: 10, rtCost: 1.2, supportsRt: true, supportsUpscaling: true },
  { slug: 'the-last-of-us-part-1', titleRu: 'Одни из нас: Часть I', titleUz: 'The Last of Us Part I', titleEn: 'The Last of Us Part I', year: 2023, engine: 'Naughty Dog Engine', genre: 'action', coverUrl: null,
    demandLow: 18, demandMedium: 24, demandHigh: 31, demandUltra: 38, cpuDemand: 42,
    vramLow: 6, vramMedium: 7.5, vramHigh: 9, vramUltra: 11, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'ghost-of-tsushima', titleRu: 'Призрак Цусимы', titleUz: 'Ghost of Tsushima', titleEn: 'Ghost of Tsushima', year: 2024, engine: 'Sucker Punch Engine', genre: 'action', coverUrl: null,
    demandLow: 14, demandMedium: 19, demandHigh: 25, demandUltra: 32, cpuDemand: 26,
    vramLow: 4.5, vramMedium: 5.5, vramHigh: 6.5, vramUltra: 8, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'horizon-forbidden-west', titleRu: 'Horizon Запретный Запад', titleUz: 'Horizon Forbidden West', titleEn: 'Horizon Forbidden West', year: 2024, engine: 'Decima', genre: 'action', coverUrl: null,
    demandLow: 16, demandMedium: 22, demandHigh: 29, demandUltra: 36, cpuDemand: 32,
    vramLow: 5, vramMedium: 6.5, vramHigh: 8, vramUltra: 9.5, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'final-fantasy-xvi', titleRu: 'Final Fantasy XVI', titleUz: 'Final Fantasy XVI', titleEn: 'Final Fantasy XVI', year: 2024, engine: 'Square Enix Engine', genre: 'rpg', coverUrl: null,
    demandLow: 22, demandMedium: 30, demandHigh: 38, demandUltra: 48, cpuDemand: 36,
    vramLow: 6, vramMedium: 7, vramHigh: 8.5, vramUltra: 10, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  // RT-освещение обязательно и заложено в demand; Ultra здесь — пресет Ultra, не Unobtanium
  { slug: 'avatar-frontiers-of-pandora', titleRu: 'Avatar: Frontiers of Pandora', titleUz: 'Avatar: Frontiers of Pandora', titleEn: 'Avatar: Frontiers of Pandora', year: 2023, engine: 'Snowdrop', genre: 'action', coverUrl: null,
    demandLow: 24, demandMedium: 33, demandHigh: 45, demandUltra: 60, cpuDemand: 32,
    vramLow: 6, vramMedium: 7.5, vramHigh: 9, vramUltra: 11, rtCost: 1.15, supportsRt: true, supportsUpscaling: true },
  { slug: 'dota-2', titleRu: 'Dota 2', titleUz: 'Dota 2', titleEn: 'Dota 2', year: 2013, engine: 'Source 2', genre: 'moba', coverUrl: null,
    demandLow: 4, demandMedium: 6, demandHigh: 8, demandUltra: 10, cpuDemand: 20,
    vramLow: 1.5, vramMedium: 2, vramHigh: 2.5, vramUltra: 3.5, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'league-of-legends', titleRu: 'League of Legends', titleUz: 'League of Legends', titleEn: 'League of Legends', year: 2009, engine: 'Riot Engine', genre: 'moba', coverUrl: null,
    demandLow: 1.5, demandMedium: 2.2, demandHigh: 3, demandUltra: 4, cpuDemand: 10,
    vramLow: 0.8, vramMedium: 1, vramHigh: 1.2, vramUltra: 1.5, rtCost: 1, supportsRt: false, supportsUpscaling: false },
  // Застроенные сервера с большим онлайном — упор в CPU
  { slug: 'rust', titleRu: 'Rust', titleUz: 'Rust', titleEn: 'Rust', year: 2018, engine: 'Unity', genre: 'survival', coverUrl: null,
    demandLow: 12, demandMedium: 17, demandHigh: 23, demandUltra: 30, cpuDemand: 50,
    vramLow: 4, vramMedium: 5, vramHigh: 7, vramUltra: 9, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'palworld', titleRu: 'Palworld', titleUz: 'Palworld', titleEn: 'Palworld', year: 2024, engine: 'Unreal Engine 5', genre: 'survival', coverUrl: null,
    demandLow: 15, demandMedium: 21, demandHigh: 29, demandUltra: 38, cpuDemand: 40,
    vramLow: 4, vramMedium: 5, vramHigh: 6.5, vramUltra: 8, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  // Эндгейм-карты с кучей эффектов грузят CPU сильнее, чем кампания
  { slug: 'path-of-exile-2', titleRu: 'Path of Exile 2', titleUz: 'Path of Exile 2', titleEn: 'Path of Exile 2', year: 2024, engine: 'Grinding Gear Engine', genre: 'rpg', coverUrl: null,
    demandLow: 11, demandMedium: 16, demandHigh: 22, demandUltra: 30, cpuDemand: 40,
    vramLow: 3.5, vramMedium: 4.5, vramHigh: 5.5, vramUltra: 7, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'diablo-4', titleRu: 'Diablo IV', titleUz: 'Diablo IV', titleEn: 'Diablo IV', year: 2023, engine: 'Blizzard Engine', genre: 'rpg', coverUrl: null,
    demandLow: 9, demandMedium: 13, demandHigh: 18, demandUltra: 24, cpuDemand: 25,
    vramLow: 4, vramMedium: 5.5, vramHigh: 7, vramUltra: 9, rtCost: 1.6, supportsRt: true, supportsUpscaling: true },
  { slug: 'resident-evil-4', titleRu: 'Resident Evil 4', titleUz: 'Resident Evil 4', titleEn: 'Resident Evil 4', year: 2023, engine: 'RE Engine', genre: 'horror', coverUrl: null,
    demandLow: 12, demandMedium: 17, demandHigh: 23, demandUltra: 30, cpuDemand: 22,
    vramLow: 5, vramMedium: 6.5, vramHigh: 8, vramUltra: 10, rtCost: 1.25, supportsRt: true, supportsUpscaling: true },
  // Полёты над городом на высокой скорости — упор в CPU (стриминг)
  { slug: 'spider-man-2', titleRu: "Marvel's Человек-паук 2", titleUz: "Marvel's Spider-Man 2", titleEn: "Marvel's Spider-Man 2", year: 2025, engine: 'Insomniac Engine', genre: 'action', coverUrl: null,
    demandLow: 19, demandMedium: 26, demandHigh: 34, demandUltra: 43, cpuDemand: 45,
    vramLow: 6, vramMedium: 7.5, vramHigh: 9, vramUltra: 11, rtCost: 1.4, supportsRt: true, supportsUpscaling: true },
  { slug: 'stellar-blade', titleRu: 'Stellar Blade', titleUz: 'Stellar Blade', titleEn: 'Stellar Blade', year: 2025, engine: 'Unreal Engine 4', genre: 'action', coverUrl: null,
    demandLow: 11, demandMedium: 16, demandHigh: 21, demandUltra: 27, cpuDemand: 20,
    vramLow: 4, vramMedium: 5, vramHigh: 6, vramUltra: 7.5, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  { slug: 'delta-force', titleRu: 'Delta Force', titleUz: 'Delta Force', titleEn: 'Delta Force', year: 2024, engine: 'Unreal Engine 4', genre: 'shooter', coverUrl: null,
    demandLow: 9, demandMedium: 13, demandHigh: 18, demandUltra: 24, cpuDemand: 28,
    vramLow: 3, vramMedium: 4, vramHigh: 5, vramUltra: 6.5, rtCost: 1, supportsRt: false, supportsUpscaling: true },
  // Bedrock-версия с RTX: без RT игра лёгкая, с RT — трассировка пути, отсюда огромный rtCost
  { slug: 'minecraft-rtx', titleRu: 'Minecraft', titleUz: 'Minecraft', titleEn: 'Minecraft', year: 2011, engine: 'Bedrock Engine', genre: 'survival', coverUrl: null,
    demandLow: 3, demandMedium: 4.5, demandHigh: 6, demandUltra: 8, cpuDemand: 15,
    vramLow: 1.5, vramMedium: 2, vramHigh: 2.5, vramUltra: 3.5, rtCost: 6, supportsRt: true, supportsUpscaling: true },
]
