package main

import (
	"fmt"
	"io"
	"log/slog"
	"math"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/json"
	"github.com/disgoorg/snowflake/v2"
	"golang.org/x/net/html"
)

type WikiSearchResult struct {
	Title       string
	Description string
	URL         string
}

var cleanDescriptionRegex = regexp.MustCompile(`\s+`)

type Magic int64
type FightingStyle int64

const MaxLevel = 140

// Discord bot constants
const (
	EmbedFooter     = "Odysseus - Made with love <3"
	BuildURLPrefix  = "https://tools.arcaneodyssey.net/gearBuilder#"
	InvalidURLMsg   = "Invalid URL! Please provide a valid GearBuilder build URL."
	ItemNotFoundMsg = "Item not found!"
	DefaultColor    = 0x93b1e3
	Version         = "v0.3.0"
)

const (
	ColorDefault  = 0x93b1e3
	ColorCommon   = 0xffffff
	ColorUncommon = 0x7f734c
	ColorRare     = 0x6765e4
	ColorExotic   = 0xea3323
)

const (
	EmptyAccessoryID   = "AAA"
	EmptyChestplateID  = "AAB"
	EmptyBootsID       = "AAC"
	EmptyEnchantmentID = "AAD"
	EmptyModifierID    = "AAE"
	EmptyGemID         = "AAF"
)

const (
	Acid Magic = iota
	Ash
	Crystal
	Earth
	Explosion
	Fire
	Glass
	Ice
	Light
	Lightning
	Magma
	Metal
	Plasma
	Poison
	Sand
	Shadow
	Snow
	Water
	Wind
	Wood
)

const (
	BasicCombat FightingStyle = iota + 20
	Boxing
	CannonFist
	IronLeg
	SailorStyle
	ThermoFist
)

var (
	ListOfMagics []Magic = []Magic{
		Ash,
		Acid,
		Crystal,
		Earth,
		Explosion,
		Fire,
		Glass,
		Ice,
		Light,
		Lightning,
		Magma,
		Metal,
		Plasma,
		Poison,
		Sand,
		Shadow,
		Snow,
		Water,
		Wind,
		Wood,
	}
	ListOfFightingStyles []FightingStyle = []FightingStyle{
		BasicCombat,
		Boxing,
		// id 2 is iron leg (FOR SOME FUCKING REASON)
		IronLeg,
		CannonFist,
		SailorStyle,
		ThermoFist,
	}

	enchantToEmojiMap  = make(map[string]string)
	modifierToEmojiMap = make(map[string]string)
	gemToEmojiMap      = make(map[string]string)

	emojiToEnchantMap  = make(map[string]*Item)
	emojiToModifierMap = make(map[string]*Item)
	emojiToGemMap      = make(map[string]*Item)
)

type Item struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Legend   string `json:"legend"`
	MainType string `json:"mainType"`
	Rarity   string `json:"rarity"`
	ImageID  string `json:"imageId"`
	Deleted  bool   `json:"deleted"`
	SubType  string `json:"subType,omitempty"`
	GemNo    int    `json:"gemNo,omitempty"`
	MinLevel int    `json:"minLevel,omitempty"`
	MaxLevel int    `json:"maxLevel,omitempty"`

	StatType      string `json:"statType,omitempty"`
	StatsPerLevel []struct {
		Level        int `json:"level"`
		Power        int `json:"power,omitempty"`
		Agility      int `json:"agility,omitempty"`
		Defense      int `json:"defense,omitempty"`
		AttackSpeed  int `json:"attackSpeed,omitempty"`
		AttackSize   int `json:"attackSize,omitempty"`
		Intensity    int `json:"intensity,omitempty"`
		Warding      int `json:"warding,omitempty"`
		Drawback     int `json:"drawback,omitempty"`
		Regeneration int `json:"regeneration,omitempty"`
		Piercing     int `json:"piercing,omitempty"`
		Resistance   int `json:"resistance,omitempty"`
	} `json:"statsPerLevel,omitempty"`

	ValidModifiers []string `json:"validModifiers,omitempty"`

	PowerIncrement        float64 `json:"powerIncrement,omitempty"`
	DefenseIncrement      float64 `json:"defenseIncrement,omitempty"`
	AgilityIncrement      float64 `json:"agilityIncrement,omitempty"`
	AttackSpeedIncrement  float64 `json:"attackSpeedIncrement,omitempty"`
	AttackSizeIncrement   float64 `json:"attackSizeIncrement,omitempty"`
	IntensityIncrement    float64 `json:"intensityIncrement,omitempty"`
	RegenerationIncrement float64 `json:"regenerationIncrement,omitempty"`
	PiercingIncrement     float64 `json:"piercingIncrement,omitempty"`
	ResistanceIncrement   float64 `json:"resistanceIncrement,omitempty"`

	Insanity     int `json:"insanity,omitempty"`
	Warding      int `json:"warding,omitempty"`
	Agility      int `json:"agility,omitempty"`
	AttackSize   int `json:"attackSize,omitempty"`
	Defense      int `json:"defense,omitempty"`
	Drawback     int `json:"drawback,omitempty"`
	Power        int `json:"power,omitempty"`
	AttackSpeed  int `json:"attackSpeed,omitempty"`
	Intensity    int `json:"intensity,omitempty"`
	Piercing     int `json:"piercing,omitempty"`
	Regeneration int `json:"regeneration,omitempty"`
	Resistance   int `json:"resistance,omitempty"`
}

type Weapon struct {
	Name          string  `json:"name"`
	Legend        string  `json:"legend"`
	Rarity        string  `json:"rarity"`
	ImageID       string  `json:"imageId"`
	Damage        float64 `json:"damage"`
	Speed         float64 `json:"speed"`
	Size          float64 `json:"size"`
	SpecialEffect string  `json:"specialEffect"`
	Efficiency    float64 `json:"efficiency"`
	Durability    int     `json:"durability,omitempty"`
	BlockingPower float64 `json:"blockingPower,omitempty"`
}

type Player struct {
	Level          int
	VitalityPoints int
	MagicPoints    int
	StrengthPoints int
	WeaponPoints   int
	Magics         []Magic
	FightingStyles []FightingStyle
	Accessories    []Slot
	Chestplate     Slot
	Boots          Slot
}

type Slot struct {
	Item     string
	Gems     []string
	Enchant  string
	Modifier string
	Level    int
}

type TotalStats struct {
	Power        int
	Defense      int
	Agility      int
	AttackSpeed  int
	AttackSize   int
	Intensity    int
	Regeneration int
	Piercing     int
	Resistance   int
	Insanity     int
	Warding      int
	Drawback     int
}

// add caching to repeated lookups
type ItemCache struct {
	cache     map[string]*Item
	nameCache map[string]*Item
	mu        sync.RWMutex
}

type WeaponCache struct {
	cache map[string]*Weapon
	mu    sync.RWMutex
}

var ListOfGems []string
var ListOfEnchants []string
var ListOfModifiers []string

var itemCache = &ItemCache{
	cache:     make(map[string]*Item),
	nameCache: make(map[string]*Item),
}

var weaponCache = &WeaponCache{
	cache: make(map[string]*Weapon),
}

var httpClient = &http.Client{
	Timeout: 30 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 100,
		IdleConnTimeout:     90 * time.Second,
	},
}

func InitializeItemCache() {
	itemCache.mu.Lock()
	defer itemCache.mu.Unlock()

	if len(ItemsData) == 0 {
		slog.Warn("ItemsData is empty, cache not initialized")
		return
	}

	itemCache.cache = make(map[string]*Item, len(ItemsData))
	itemCache.nameCache = make(map[string]*Item, len(ItemsData))
	for i := range ItemsData {
		item := ItemsData[i]

		itemCache.cache[item.ID] = &item
		itemCache.nameCache[strings.ToLower(item.Name)] = &item

		switch item.MainType {
		case "Gem":
			if item.ID != EmptyGemID {
				ListOfGems = append(ListOfGems, item.ID)
				emoji := gemIntoEmoji(&item)
				if emoji != "" {
					gemToEmojiMap[item.Name] = emoji
					emojiToGemMap[emoji] = &item
				}
			}
		case "Modifier":
			if item.ID != EmptyModifierID {
				ListOfModifiers = append(ListOfModifiers, item.ID)
				emoji := modifierIntoEmoji(&item)
				if emoji != "" {
					modifierToEmojiMap[item.Name] = emoji
					emojiToModifierMap[emoji] = &item
				}
			}
		case "Enchant":
			if item.ID != EmptyEnchantmentID {
				ListOfEnchants = append(ListOfEnchants, item.ID)
				emoji := enchantIntoEmoji(&item)
				if emoji != "" {
					enchantToEmojiMap[item.Name] = emoji
					emojiToEnchantMap[emoji] = &item
				}
			}
		}
	}
	slog.Info("item cache initialized", "items", len(itemCache.cache))
}

func InitializeWeaponCache() {
	weaponCache.mu.Lock()
	defer weaponCache.mu.Unlock()

	if len(WeaponsData) == 0 {
		slog.Warn("ItemsData is empty, cache not initialized")
		return
	}

	weaponCache.cache = make(map[string]*Weapon, len(WeaponsData))

	for i := range WeaponsData {
		weapon := WeaponsData[i]
		weaponCache.cache[strings.ToLower(weapon.Name)] = &weapon
	}

	slog.Info("weapon cache initialized", "weapons", len(weaponCache.cache))
}

func FindByIDCached(id string) *Item {
	itemCache.mu.RLock()
	defer itemCache.mu.RUnlock()

	if item, exists := itemCache.cache[id]; exists {
		return item
	}

	// return empty item if not found
	return &Item{Name: "Unknown", ID: id}
}

func FindWeapon(name string) *Weapon {
	weaponCache.mu.RLock()
	defer weaponCache.mu.RUnlock()

	if item, exists := weaponCache.cache[name]; exists {
		return item
	}

	return &Weapon{Name: "Unknown"}
}

func GetRarityColor(rarity string) int {
	switch rarity {
	case "Common":
		return ColorCommon
	case "Uncommon":
		return ColorUncommon
	case "Rare":
		return ColorRare
	case "Exotic":
		return ColorExotic
	default:
		return ColorDefault
	}
}

func FindByNameCached(name string) *Item {
	itemCache.mu.RLock()
	defer itemCache.mu.RUnlock()

	if item, exists := itemCache.nameCache[strings.ToLower(name)]; exists {
		return item
	}
	return nil
}

func BoolToPtr(b bool) *bool {
	return &b
}

func GetItemData() error {
	fileContent, err := os.ReadFile("items.json")

	if err == nil {
		slog.Info("items.json found, decoding...")
		err = json.Unmarshal(fileContent, &ItemsData)
		if err != nil {
			slog.Warn("failed to decode, falling back to fetching api...")
		} else {
			slog.Info("succesfully decoded json")
			InitializeItemCache()
			return nil
		}
	} else if os.IsNotExist(err) {
		slog.Warn("item.json doesn't exist, fetching from api...")
	} else {
		slog.Error("error reading items.json")
		return err
	}

	resp, err := httpClient.Get("https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/items.json")
	if err != nil {
		return fmt.Errorf("cannot fetch items: %w", err)
	}

	defer resp.Body.Close()

	respBytes, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		return fmt.Errorf("cannot read response body: %w", readErr)
	}

	unmarshalErr := json.Unmarshal(respBytes, &ItemsData)
	if unmarshalErr != nil {
		return fmt.Errorf("cannot unmarshal response body: %w", unmarshalErr)
	}

	file, fileErr := json.MarshalIndent(ItemsData, "", "  ")
	if fileErr != nil {
		return fmt.Errorf("cannot encode marshal response body: %w", fileErr)
	}

	writeErr := os.WriteFile("items.json", file, 0644)
	if writeErr != nil {
		return fmt.Errorf("cannot write file: %w", writeErr)
	}

	slog.Info("finished fetching item data from API")
	InitializeItemCache()
	return nil
}

func GetWeaponData() error {
	fileContent, err := os.ReadFile("weapons.json")

	if err == nil {
		slog.Info("weapons.json found, decoding...")
		err = json.Unmarshal(fileContent, &WeaponsData)
		if err != nil {
			slog.Warn("failed to decode, falling back to fetching api...", slog.Any("err", err))
		} else {
			slog.Info("succesfully decoded json")
			InitializeWeaponCache()
			return nil
		}
	} else if os.IsNotExist(err) {
		slog.Warn("weapons.json doesn't exist, fetching from api...")
	} else {
		slog.Error("error reading weapons.json")
		return err
	}

	resp, err := httpClient.Get("https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/weapons.json")
	if err != nil {
		return fmt.Errorf("cannot fetch weapons: %w", err)
	}

	defer resp.Body.Close()

	respBytes, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		return fmt.Errorf("cannot read response body: %w", readErr)
	}

	unmarshalErr := json.Unmarshal(respBytes, &ItemsData)
	if unmarshalErr != nil {
		return fmt.Errorf("cannot unmarshal response body: %w", unmarshalErr)
	}

	file, fileErr := json.MarshalIndent(ItemsData, "", "  ")
	if fileErr != nil {
		return fmt.Errorf("cannot encode marshal response body: %w", fileErr)
	}

	writeErr := os.WriteFile("weapons.json", file, 0644)
	if writeErr != nil {
		return fmt.Errorf("cannot write file: %w", writeErr)
	}

	slog.Info("finished fetching data from API")
	InitializeWeaponCache()
	return nil
}

func UnhashBuildCode(code string) (Player, error) {
	var slotCodeArray [][]string
	var player Player

	for _, v := range strings.Split(code, "|") {
		slotCodeArray = append(slotCodeArray, strings.Split(v, ","))
	}

	slog.Debug(fmt.Sprintf("%v", slotCodeArray))

	// bound checks

	if len(slotCodeArray) < 8 {
		return Player{}, fmt.Errorf("invalid build code format: expected at least 3 sections, got %d", len(slotCodeArray))
	}

	if len(slotCodeArray[0]) < 5 {
		return Player{}, fmt.Errorf("invalid stats section: expected 5 values, got %d", len(slotCodeArray[0]))
	}

	// get stat allocations

	level, err := strconv.Atoi(slotCodeArray[0][0])
	if err != nil {
		return Player{}, fmt.Errorf("failed to convert player level to int. value: %v. error: %v", slotCodeArray[0][0], err)
	}
	player.Level = level

	vitalityPoints, err := strconv.Atoi(slotCodeArray[0][1])
	if err != nil {
		return Player{}, fmt.Errorf("failed to convert player vitalityPoints to int. value: %v. error: %v", slotCodeArray[0][1], err)
	}
	player.VitalityPoints = vitalityPoints

	magicPoints, err := strconv.Atoi(slotCodeArray[0][2])
	if err != nil {
		return Player{}, fmt.Errorf("failed to convert player magicPoints to int. value: %v. error: %v", slotCodeArray[0][2], err)
	}
	player.MagicPoints = magicPoints

	strengthPoints, err := strconv.Atoi(slotCodeArray[0][3])
	if err != nil {
		return Player{}, fmt.Errorf("failed to convert player strengthPoints to int. value: %v. error: %v", slotCodeArray[0][3], err)
	}
	player.StrengthPoints = strengthPoints

	weaponPoints, err := strconv.Atoi(slotCodeArray[0][4])
	if err != nil {
		return Player{}, fmt.Errorf("failed to convert player weaponPoints to int. value: %v. error: %v", slotCodeArray[0][4], err)
	}
	player.WeaponPoints = weaponPoints

	// get magics
	if len(slotCodeArray[1]) > 0 && slotCodeArray[1][0] != "" {
		for _, magicStr := range slotCodeArray[1] {
			if magicStr == "" {
				continue
			}
			magic, err := strconv.Atoi(magicStr)
			if err != nil {
				return Player{}, fmt.Errorf("failed to convert magic to int: %w", err)
			}
			if magic < 0 || magic >= len(ListOfMagics) {
				return Player{}, fmt.Errorf("invalid magic index: %d", magic)
			}
			player.Magics = append(player.Magics, ListOfMagics[magic])
		}
	}

	// get fighting styles
	if len(slotCodeArray[2]) > 0 && slotCodeArray[2][0] != "" {
		for _, fsStr := range slotCodeArray[2] {
			if fsStr == "" {
				continue
			}
			fs, err := strconv.Atoi(fsStr)
			if err != nil {
				return Player{}, fmt.Errorf("failed to convert fighting style to int: %w", err)
			}
			if fs < 0 || fs >= len(ListOfFightingStyles) {
				return Player{}, fmt.Errorf("invalid fighting style index: %d", fs)
			}
			player.FightingStyles = append(player.FightingStyles, ListOfFightingStyles[fs])
		}
	}

	// get accessories
	accessoryOne, err := parseItem(slotCodeArray[3])
	if err != nil {
		return Player{}, fmt.Errorf("failed to parse accessory one: %w", err)
	}
	player.Accessories = append(player.Accessories, accessoryOne)

	accessoryTwo, err := parseItem(slotCodeArray[4])
	if err != nil {
		return Player{}, fmt.Errorf("failed to parse accessory two: %w", err)
	}
	player.Accessories = append(player.Accessories, accessoryTwo)

	accessoryThree, err := parseItem(slotCodeArray[5])
	if err != nil {
		return Player{}, fmt.Errorf("failed to parse accessory three: %w", err)
	}
	player.Accessories = append(player.Accessories, accessoryThree)

	// get armor and boots
	chestplate, err := parseItem(slotCodeArray[6])
	if err != nil {
		return Player{}, fmt.Errorf("failed to parse chestplate: %w", err)
	}
	player.Chestplate = chestplate

	boots, err := parseItem(slotCodeArray[7])
	if err != nil {
		return Player{}, fmt.Errorf("failed to parse boots: %w", err)
	}
	player.Boots = boots

	return player, nil
}

func parseItem(slotCodeArray []string) (Slot, error) {
	var slot Slot

	if len(slotCodeArray) < 4 || len(slotCodeArray) > 7 {
		return Slot{}, fmt.Errorf("invalid slot format: expected at least 4 values and no more than 7 values, got %d", len(slotCodeArray))
	}

	slot.Item = slotCodeArray[0]
	slot.Enchant = slotCodeArray[1]
	slot.Modifier = slotCodeArray[2]

	// 3 gem slots
	if len(slotCodeArray) == 7 {
		slot.Gems = append(slot.Gems, slotCodeArray[3])
		slot.Gems = append(slot.Gems, slotCodeArray[4])
		slot.Gems = append(slot.Gems, slotCodeArray[5])

		itemLevel, err := strconv.Atoi(slotCodeArray[6])
		if err != nil {
			return Slot{}, fmt.Errorf("error parsing item level: %w", err)
		}

		slot.Level = itemLevel

		return slot, nil
	}

	// 2 gem slots
	if len(slotCodeArray) == 6 {
		slot.Gems = append(slot.Gems, slotCodeArray[3])
		slot.Gems = append(slot.Gems, slotCodeArray[4])

		itemLevel, err := strconv.Atoi(slotCodeArray[5])
		if err != nil {
			return Slot{}, fmt.Errorf("error parsing item level: %w", err)
		}

		slot.Level = itemLevel

		return slot, nil
	}

	// 1 gem slot
	if len(slotCodeArray) == 5 {
		slot.Gems = append(slot.Gems, slotCodeArray[3])

		itemLevel, err := strconv.Atoi(slotCodeArray[4])
		if err != nil {
			return Slot{}, fmt.Errorf("error parsing item level: %w", err)
		}

		slot.Level = itemLevel

		return slot, nil
	}

	// no gem slots
	if len(slotCodeArray) == 4 {
		itemLevel, err := strconv.Atoi(slotCodeArray[3])
		if err != nil {
			return Slot{}, fmt.Errorf("error parsing item level: %w", err)
		}

		slot.Level = itemLevel

		return slot, nil
	}

	return Slot{}, fmt.Errorf("failed to determine gem slot amount")
}

func MagicFsIntoEmoji[k Magic | FightingStyle](content k) string {
	switch content {
	// magic cases
	case k(Acid):
		return "<:acid:1393706537419145378>"
	case k(Ash):
		return "<:ash:1393706539273162842>"
	case k(Crystal):
		return "<:crystal:1393706540850090064>"
	case k(Earth):
		return "<:earth:1393706543157088307>"
	case k(Explosion):
		return "<:explosion:1393706544926949516>"
	case k(Fire):
		return "<:fire:1393706546453544980>"
	case k(Glass):
		return "<:glass:1393706547950915666>"
	case k(Ice):
		return "<:ice:1393706549716717628>"
	case k(Light):
		return "<:light:1393706551495233629>"
	case k(Lightning):
		return "<:lightning:1393706553650974831>"
	case k(Magma):
		return "<:magma:1393706555572224030>"
	case k(Metal):
		return "<:metal:1393706594142916808>"
	case k(Plasma):
		return "<:plasma:1393706559401365674>"
	case k(Poison):
		return "<:poison:1393706598400135238>"
	case k(Sand):
		return "<:sand:1393706514249810062>"
	case k(Shadow):
		return "<:shadow:1393706515747180596>"
	case k(Snow):
		return "<:snow:1393706517718372402>"
	case k(Water):
		return "<:water:1393706519442489446>"
	case k(Wind):
		return "<:wind:1393706520889397360>"
	case k(Wood):
		return "<:wood:1393706523032682619>"
	// fightingStyle cases
	case k(BasicCombat):
		return "<:basiccombat:1393706037227556864>"
	case k(Boxing):
		return "<:boxing:1393706038892560626>"
	case k(CannonFist):
		return "<:cannonfist:1393706041124061386>"
	case k(IronLeg):
		return "<:ironleg:1393706043057504378>"
	case k(SailorStyle):
		return "<:sailorstyle:1393706011428393031>"
	case k(ThermoFist):
		return "<:thermofist:1393706015010324572>"
	default:
		return ""
	}
}

func enchantIntoEmoji(item *Item) string {
	switch item.Name {
	case "Strong":
		return "<:strong:1393732208673685615>"
	case "Hard":
		return "<:hard:1393732146514100334>"
	case "Nimble":
		return "<:nimble:1393732189136359656>"
	case "Amplified":
		return "<:amplified:1393732134249828422>"
	case "Bursting":
		return "<:bursting:1393732138754375801>"
	case "Swift":
		return "<:swift:1393732211379011624>"
	case "Powerful":
		return "<:powerful:1393732190595973180>"
	case "Armored":
		return "<:armored:1393732135604584489>"
	case "Agile":
		return "<:agile:1393732132588752946>"
	case "Enhanced":
		return "<:enhanced:1393732142772781076>"
	case "Explosive":
		return "<:explosive:1393732144869806151>"
	case "Brisk":
		return "<:brisk:1393732137315733564>"
	case "Charged":
		return "<:charged:1393732140533026846>"
	case "Virtuous":
		return "<:virtuous:1393732213480099940>"
	case "Hasty":
		return "<:hasty:1393732148699332718>"
	case "Healing":
		return "<:healing:1393732150288711690>"
	case "Resilience":
		return "<:resilience:1393732207155216404>"
	case "Piercing":
		return "<:piercing:1393732154491408507>"
	default:
		return ""
	}
}

func modifierIntoEmoji(item *Item) string {
	switch item.Name {
	case "Abyssal":
		return "<:abyssal:1393733751279718591>"
	case "Archaic":
		return "<:archaic:1393733752877744178>"
	case "Atlantean Essence":
		return "<:atlantean:1393733755088404665>"
	case "Blasted":
		return "<:blasted:1393733757537882144>"
	case "Crystalline":
		return "<:crystalline:1393733759114936443>"
	case "Drowned":
		return "<:drowned:1393733760670896128>"
	case "Frozen":
		return "<:frozen:1393733762541682870>"
	case "Superheated":
		return "<:superheated:1393733766517887006>"
	case "Sandy":
		return "<:sandy:1393733763938386000>"
	default:
		return ""
	}
}

func gemIntoEmoji(item *Item) string {
	switch item.Name {
	case "Defense Gem":
		return "<:defensegem:1393733031927349268>"
	case "Power Gem":
		return "<:powergem:1393733189289115710>"
	case "Attack Speed Gem":
		return "<:attackspeedgem:1393733075699105943>"
	case "Attack Size Gem":
		return "<:attacksizegem:1393733045210845336>"
	case "Agility Gem":
		return "<:agilitygem:1393733033659469926>"
	case "Intensity Gem":
		return "<:intensitygem:1393733041079324734>"
	// yes, lapiz lazuli is mispelled in items.json. smh
	case "Lapiz Lazuli":
		return "<:lapislazuli:1393733050508251177>"
	case "Larimar":
		return "<:larimar:1393733187091435520>"
	case "Agate":
		return "<:agate:1393733030019076177>"
	case "Malachite":
		return "<:malachite:1393733054895231077>"
	case "Candelaria":
		return "<:candelaria:1393733039049408657>"
	case "Morenci":
		return "<:morenci:1393733059039465562>"
	case "Painite":
		return "<:painite:1393733069969817762>"
	case "Kyanite":
		return "<:kyanite:1393733049115611136>"
	case "Variscite":
		return "<:variscite:1393733193798123560>"
	// these have prefixes. why????
	case "Perfect Azurite":
		return "<:azurite:1393733037447184394>"
	case "Perfect Aventurine":
		return "<:aventurine:1393733035450699910>"
	case "Perfect Fire Opal":
		return "<:fireopal:1393733046792093837>"
	default:
		return ""
	}
}

func EnchantIntoEmoji(item *Item) string {
	if item == nil {
		return ""
	}
	return enchantToEmojiMap[item.Name]
}

func ModifierIntoEmoji(item *Item) string {
	if item == nil {
		return ""
	}
	return modifierToEmojiMap[item.Name]
}

func GemIntoEmoji(item *Item) string {
	if item == nil {
		return ""
	}
	return gemToEmojiMap[item.Name]
}

func EmojiIntoEnchant(emoji string) *Item {
	if item, ok := emojiToEnchantMap[emoji]; ok {
		return item
	}
	return &Item{Name: "Unknown"}
}

func EmojiIntoModifier(emoji string) *Item {
	if item, ok := emojiToModifierMap[emoji]; ok {
		return item
	}
	return &Item{Name: "Unknown"}
}

func EmojiIntoGem(emoji string) *Item {
	if item, ok := emojiToGemMap[emoji]; ok {
		return item
	}
	return &Item{Name: "Unknown"}
}

func AddItemStats(slot Slot, total *TotalStats) {
	if slot.Item == EmptyAccessoryID || slot.Item == EmptyChestplateID || slot.Item == EmptyBootsID {
		return
	}

	var slotStats TotalStats

	item := FindByIDCached(slot.Item)
	enchantment := FindByIDCached(slot.Enchant)
	modifier := FindByIDCached(slot.Modifier)

	level := math.Floor(float64(slot.Level)/10) * 10
	multiplier := math.Floor(float64(slot.Level) / 10)

	var levelStatsFound bool

	// base item stats (at the slot's level)
	if len(item.StatsPerLevel) > 0 {
		// find the appropriate stats for the item level
		// FIXME what if item max level isn't 140 but for example 100? like in the case of item d7S
		for _, v := range item.StatsPerLevel {
			if v.Level == int(level) {
				levelStatsFound = true
				slotStats.Agility += v.Agility
				slotStats.AttackSize += v.AttackSize
				slotStats.AttackSpeed += v.AttackSpeed
				slotStats.Defense += v.Defense
				slotStats.Drawback += v.Drawback
				slotStats.Intensity += v.Intensity
				slotStats.Piercing += v.Piercing
				slotStats.Power += v.Power
				slotStats.Regeneration += v.Regeneration
				slotStats.Resistance += v.Resistance
				slotStats.Warding += v.Warding
			}
		}

		if !levelStatsFound {
			lastStatPerLevel := item.StatsPerLevel[len(item.StatsPerLevel)-1]
			slotStats.Agility += lastStatPerLevel.Agility
			slotStats.AttackSize += lastStatPerLevel.AttackSize
			slotStats.AttackSpeed += lastStatPerLevel.AttackSpeed
			slotStats.Defense += lastStatPerLevel.Defense
			slotStats.Drawback += lastStatPerLevel.Drawback
			slotStats.Intensity += lastStatPerLevel.Intensity
			slotStats.Piercing += lastStatPerLevel.Piercing
			slotStats.Power += lastStatPerLevel.Power
			slotStats.Regeneration += lastStatPerLevel.Regeneration
			slotStats.Resistance += lastStatPerLevel.Resistance
			slotStats.Warding += lastStatPerLevel.Warding

		}
	}

	// Fixed item stats
	slotStats.Power += item.Power
	slotStats.Defense += item.Defense
	slotStats.Agility += item.Agility
	slotStats.AttackSpeed += item.AttackSpeed
	slotStats.AttackSize += item.AttackSize
	slotStats.Intensity += item.Intensity
	slotStats.Regeneration += item.Regeneration
	slotStats.Piercing += item.Piercing
	slotStats.Resistance += item.Resistance
	slotStats.Insanity += item.Insanity
	slotStats.Warding += item.Warding
	slotStats.Drawback += item.Drawback

	// Enchantment stats
	if enchantment.ID != EmptyEnchantmentID { // Not "None"

		slotStats.Power += int(math.Floor(enchantment.PowerIncrement * multiplier))
		slotStats.Defense += int(math.Floor(enchantment.DefenseIncrement * multiplier))
		slotStats.Agility += int(math.Floor(enchantment.AgilityIncrement * multiplier))
		slotStats.AttackSpeed += int(math.Floor(enchantment.AttackSpeedIncrement * multiplier))
		slotStats.AttackSize += int(math.Floor(enchantment.AttackSizeIncrement * multiplier))
		slotStats.Intensity += int(math.Floor(enchantment.IntensityIncrement * multiplier))
		slotStats.Regeneration += int(math.Floor(enchantment.RegenerationIncrement * multiplier))
		slotStats.Piercing += int(math.Floor(enchantment.PiercingIncrement * multiplier))
		slotStats.Resistance += int(math.Floor(enchantment.ResistanceIncrement * multiplier))
		slotStats.Warding += enchantment.Warding
	}

	// Gem stats
	for _, gemID := range slot.Gems {
		if gemID == EmptyGemID || gemID == "" { // Skip "None" gems
			continue
		}
		gem := FindByIDCached(gemID)
		slotStats.Power += gem.Power
		slotStats.Defense += gem.Defense
		slotStats.Agility += gem.Agility
		slotStats.AttackSpeed += gem.AttackSpeed
		slotStats.AttackSize += gem.AttackSize
		slotStats.Intensity += gem.Intensity
		slotStats.Regeneration += gem.Regeneration
		slotStats.Piercing += gem.Piercing
		slotStats.Resistance += gem.Resistance
		slotStats.Drawback += gem.Drawback
	}

	// modifier incremental stats
	if modifier.Name != "Atlantean Essence" {
		slotStats.Agility += int(math.Floor(modifier.AgilityIncrement * multiplier))
		slotStats.AttackSize += int(math.Floor(modifier.AttackSizeIncrement * multiplier))
		slotStats.AttackSpeed += int(math.Floor(modifier.AttackSpeedIncrement * multiplier))
		slotStats.Defense += int(math.Floor(modifier.DefenseIncrement * multiplier))
		slotStats.Intensity += int(math.Floor(modifier.IntensityIncrement * multiplier))
		slotStats.Piercing += int(math.Floor(modifier.PiercingIncrement * multiplier))
		slotStats.Power += int(math.Floor(modifier.PowerIncrement * multiplier))
		slotStats.Regeneration += int(math.Floor(modifier.RegenerationIncrement * multiplier))
		slotStats.Resistance += int(math.Floor(modifier.ResistanceIncrement * multiplier))
	} else {
		slotStats.Insanity += 1
		if slotStats.Power == 0 {
			slotStats.Power += 1 * int(multiplier)
		} else if slotStats.Defense == 0 {
			slotStats.Defense += int(math.Floor(9.07 * multiplier))
		} else if slotStats.AttackSize == 0 {
			slotStats.AttackSize += 3 * int(multiplier)
		} else if slotStats.AttackSpeed == 0 {
			slotStats.AttackSpeed += 3 * int(multiplier)
		} else if slotStats.Agility == 0 {
			slotStats.Agility += 3 * int(multiplier)
		} else if slotStats.Intensity == 0 {
			slotStats.Intensity += 3 * int(multiplier)
		} else {
			slotStats.Power += 1 * int(multiplier)
		}
	}

	total.Power += slotStats.Power
	total.Defense += slotStats.Defense
	total.Agility += slotStats.Agility
	total.AttackSpeed += slotStats.AttackSpeed
	total.AttackSize += slotStats.AttackSize
	total.Intensity += slotStats.Intensity
	total.Regeneration += slotStats.Regeneration
	total.Piercing += slotStats.Piercing
	total.Resistance += slotStats.Resistance
	total.Insanity += slotStats.Insanity
	total.Warding += slotStats.Warding
	total.Drawback += slotStats.Drawback
}

func CalculateTotalStats(player Player) TotalStats {
	var total TotalStats

	// calculate stats for all equipped items
	for _, accessory := range player.Accessories {
		AddItemStats(accessory, &total)
	}
	AddItemStats(player.Chestplate, &total)
	AddItemStats(player.Boots, &total)

	return total
}

func FormatTotalStats(stats TotalStats) string {
	var builder strings.Builder
	builder.Grow(200)

	// define stats with their emojis in order
	statEntries := []struct {
		emoji string
		value int
	}{
		{"<:power:1392363667059904632>", stats.Power},
		{"<:defense:1392364201262977054>", stats.Defense},
		{"<:agility:1392364894573297746>", stats.Agility},
		{"<:attackspeed:1392364933722804274>", stats.AttackSpeed},
		{"<:attacksize:1392364917616807956>", stats.AttackSize},
		{"<:intensity:1392365008049934377>", stats.Intensity},
		{"<:regeneration:1392365064010469396>", stats.Regeneration},
		{"<:piercing:1392365031705808986>", stats.Piercing},
		{"<:resistance:1393458741009186907>", stats.Resistance},
		{"<:drawback:1392364965905563698>", stats.Drawback},
		{"<:warding:1392366478560596039>", stats.Warding},
		{"<:insanity:1392364984658301031>", stats.Insanity},
	}

	for _, entry := range statEntries {
		if entry.value != 0 {
			builder.WriteString(fmt.Sprintf("%s %d\n", entry.emoji, entry.value))
		}
	}

	if builder.Len() == 0 {
		return "No stats"
	}

	return builder.String()
}

func IsCacheInitialized() bool {
	itemCache.mu.RLock()
	defer itemCache.mu.RUnlock()
	return len(itemCache.cache) > 0
}

func BuildSlotField(name string, slot Slot, emptyID string) discord.EmbedField {
	if slot.Item == emptyID {
		return discord.EmbedField{
			Name:   name,
			Value:  "None",
			Inline: BoolToPtr(true),
		}
	}

	item := FindByIDCached(slot.Item)
	enchantment := FindByIDCached(slot.Enchant)
	modifier := FindByIDCached(slot.Modifier)

	var builder strings.Builder
	builder.Grow(100)

	// Item name
	builder.WriteString(item.Name)
	builder.WriteString("\n")

	// Enchantment and modifier
	builder.WriteString(EnchantIntoEmoji(enchantment))
	builder.WriteString(ModifierIntoEmoji(modifier))
	builder.WriteString("\n")

	// Gems
	for _, gemID := range slot.Gems {
		if gemID != EmptyGemID && gemID != "" {
			builder.WriteString(GemIntoEmoji(FindByIDCached(gemID)))
		}
	}

	return discord.EmbedField{
		Name:   name,
		Value:  builder.String(),
		Inline: BoolToPtr(true),
	}
}

func StringToEmoji(str string) snowflake.ID {
	parts := strings.Split(str, ":")
	if len(parts) != 3 {
		return 0
	}
	idStr := strings.TrimSuffix(parts[2], ">")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0
	}
	return snowflake.ID(id)
}

func EmbedToSlot(embed discord.Embed) Slot {
	var slot Slot
	itemID := strings.Split(embed.Author.Name, " | ")[1]

	slot.Item = itemID
	slot.Level = MaxLevel

	var gemsField discord.EmbedField
	var enchantsField discord.EmbedField
	var modifierField discord.EmbedField

	for _, v := range embed.Fields {
		if v.Name == "Gems" {
			gemsField = v
			continue
		}
		if v.Name == "Enchant" {
			enchantsField = v
			continue
		}
		if v.Name == "Modifier" {
			modifierField = v
			continue
		}
	}

	if gemsField.Value != "" && gemsField.Value != "None" {
		gemEmojis := strings.Split(gemsField.Value, " ")
		for _, v := range gemEmojis {
			if v == "" {
				continue
			}
			gemItem := EmojiIntoGem(v)
			if gemItem != nil && gemItem.ID != "" {
				slot.Gems = append(slot.Gems, gemItem.ID)
			}
		}
	}

	if enchantsField.Value != "" {
		enchantItem := EmojiIntoEnchant(enchantsField.Value)
		if enchantItem != nil {
			slot.Enchant = enchantItem.ID
		}
	}

	if modifierField.Value != "" {
		modifierItem := EmojiIntoModifier(modifierField.Value)
		if modifierItem != nil {
			slot.Modifier = modifierItem.ID
		}
	}

	return slot
}

func BuildItemEditorResponse(slot Slot, user discord.User) discord.MessageUpdate {
	item := FindByIDCached(slot.Item)
	var total TotalStats
	AddItemStats(slot, &total)

	fields := buildEmbedFields(item, slot, total)

	embed := discord.NewEmbedBuilder().
		SetAuthor(fmt.Sprintf("%s | %s", user.Username, item.ID), "", user.EffectiveAvatarURL()).
		SetTitle(item.Name).
		SetFields(fields...).
		SetTimestamp(time.Now()).
		SetFooter(EmbedFooter, "").
		SetColor(GetRarityColor(item.Rarity))

	if item.ImageID != "NO_IMAGE" && item.ImageID != "" {
		embed.SetThumbnail(item.ImageID)
	}

	update := discord.NewMessageUpdateBuilder().
		AddEmbeds(embed.Build()).
		ClearContainerComponents()

	buttons := getAvailableActionButtons(slot, item)
	if len(buttons) > 0 {
		update.AddActionRow(buttons...)
	}

	return update.Build()
}

func buildEmbedFields(item *Item, slot Slot, total TotalStats) []discord.EmbedField {
	var fields []discord.EmbedField
	ptrTrue := BoolToPtr(true)

	fields = append(fields,
		discord.EmbedField{Name: "Description", Value: item.Legend},
		discord.EmbedField{Name: "Stats", Value: FormatTotalStats(total)},
		discord.EmbedField{Name: "Type", Value: item.MainType, Inline: ptrTrue},
	)
	if item.SubType != "" {
		fields = append(fields, discord.EmbedField{Name: "Sub Type", Value: item.SubType, Inline: ptrTrue})
	}
	if item.Rarity != "" {
		fields = append(fields, discord.EmbedField{Name: "Rarity", Value: item.Rarity, Inline: ptrTrue})
	}
	if item.MinLevel != 0 && item.MaxLevel != 0 {
		fields = append(fields, discord.EmbedField{Name: "Level Range", Value: fmt.Sprintf("%d - %d", item.MinLevel, item.MaxLevel), Inline: ptrTrue})
	}

	if slot.Enchant != EmptyEnchantmentID && slot.Enchant != "" {
		enchantEmoji := EnchantIntoEmoji(FindByIDCached(slot.Enchant))
		if enchantEmoji == "" {
			enchantEmoji = "None"
		}
		fields = append(fields, discord.EmbedField{Name: "Enchant", Value: enchantEmoji, Inline: ptrTrue})
	}

	if slot.Modifier != EmptyModifierID && slot.Modifier != "" {
		modifierEmoji := ModifierIntoEmoji(FindByIDCached(slot.Modifier))
		if modifierEmoji == "" {
			modifierEmoji = "None"
		}
		fields = append(fields, discord.EmbedField{Name: "Modifier", Value: modifierEmoji, Inline: ptrTrue})
	}

	if len(slot.Gems) > 0 {
		var gems strings.Builder
		if item.GemNo > 0 {
			displayGems := make([]string, item.GemNo)
			copy(displayGems, slot.Gems)
			for _, gemID := range displayGems {
				if gemID != "" && gemID != EmptyGemID {
					gems.WriteString(GemIntoEmoji(FindByIDCached(gemID)))
				}
				gems.WriteString(" ")
			}

			fields = append(fields, discord.EmbedField{Name: "Gems", Value: gems.String(), Inline: ptrTrue})
		}
	}
	return fields
}

func getAvailableActionButtons(slot Slot, item *Item) []discord.InteractiveComponent {
	var buttons []discord.InteractiveComponent

	if (slot.Enchant == "" || slot.Enchant == EmptyEnchantmentID) && (item.MainType == "Accessory" || item.MainType == "Chestplate" || item.MainType == "Pants") {
		buttons = append(buttons, discord.NewSecondaryButton("Add Enchant", "item_add_enchant"))
	}
	if (slot.Modifier == "" || slot.Modifier == EmptyModifierID) && len(item.ValidModifiers) > 0 {
		buttons = append(buttons, discord.NewSecondaryButton("Add Modifier", "item_add_modifier"))
	}

	if item.GemNo > 0 {
		hasEmptySlot := len(slot.Gems) < item.GemNo
		if !hasEmptySlot {
			for _, gemID := range slot.Gems {
				if gemID == "" || gemID == EmptyGemID {
					hasEmptySlot = true
					break
				}
			}
		}
		if hasEmptySlot {
			buttons = append(buttons, discord.NewSecondaryButton("Add Gems", "item_add_gem"))
		}
	}

	return buttons
}

func SearchWiki(query string) ([]WikiSearchResult, error) {
	// encode the query
	encodedQuery := url.QueryEscape(query)
	searchURL := fmt.Sprintf("https://roblox-arcane-odyssey.fandom.com/wiki/Special:Search?scope=internal&navigationSearch=true&query=%s", encodedQuery)

	// make HTTP request
	resp, err := httpClient.Get(searchURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch search results: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("search request failed with status: %d", resp.StatusCode)
	}

	// parse HTML
	doc, err := html.Parse(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	// extract search results
	results := ExtractSearchResults(doc)
	return results, nil
}

func ExtractSearchResults(n *html.Node) []WikiSearchResult {
	var results []WikiSearchResult

	// find search results - fandom uses different classes but typically contains "unified-search__result"
	if n.Type == html.ElementNode && n.Data == "li" {
		for _, attr := range n.Attr {
			if attr.Key == "class" && strings.Contains(attr.Val, "unified-search__result") {
				result := ParseSearchResult(n)
				if result.Title != "" {
					results = append(results, result)
				}
				break
			}
		}
	}

	// recursively search child nodes
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		results = append(results, ExtractSearchResults(c)...)
	}

	return results
}

func ParseSearchResult(n *html.Node) WikiSearchResult {
	var result WikiSearchResult

	// find title link
	titleLink := FindElementWithClass(n, "a", "unified-search__result__title")
	if titleLink != nil {
		result.Title = GetTextContent(titleLink)
		for _, attr := range titleLink.Attr {
			if attr.Key == "href" {
				if strings.HasPrefix(attr.Val, "/") {
					result.URL = "https://roblox-arcane-odyssey.fandom.com" + attr.Val
				} else {
					result.URL = attr.Val
				}
				break
			}
		}
	}

	// find description
	descElement := FindElementWithClass(n, "p", "unified-search__result__snippet")
	if descElement != nil {
		result.Description = GetTextContent(descElement)
		// clean up description
		result.Description = strings.TrimSpace(result.Description)
		result.Description = cleanDescriptionRegex.ReplaceAllString(result.Description, " ")
	}

	return result
}

func FindElementWithClass(n *html.Node, tagName, className string) *html.Node {
	if n.Type == html.ElementNode && n.Data == tagName {
		for _, attr := range n.Attr {
			if attr.Key == "class" && strings.Contains(attr.Val, className) {
				return n
			}
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if result := FindElementWithClass(c, tagName, className); result != nil {
			return result
		}
	}

	return nil
}

func GetTextContent(n *html.Node) string {
	if n.Type == html.TextNode {
		return n.Data
	}

	var result strings.Builder
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		result.WriteString(GetTextContent(c))
	}

	return result.String()
}
