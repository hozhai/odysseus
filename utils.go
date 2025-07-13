package main

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/disgoorg/json"
)

type Magic int64
type FightingStyle int64

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
		CannonFist,
		IronLeg,
		SailorStyle,
		ThermoFist,
	}
)

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
	Item        string
	Gems        []string
	Enchantment string
	Modifier    string
	Level       int
}

func BoolToPtr(b bool) *bool {
	return &b
}

func GetData() error {
	fileContent, err := os.ReadFile("items.json")

	if err == nil {
		slog.Info("items.json found, decoding...")
		err = json.Unmarshal(fileContent, &APIData)
		if err != nil {
			slog.Warn("failed to decode, falling back to fetching api...")
		} else {
			slog.Info("succesfully decoded json")
			return nil
		}
	} else if os.IsNotExist(err) {
		slog.Warn("item.json doesn't exist, fetching from api...")
	} else {
		slog.Error("error reading items.json")
		return err
	}

	resp, err := http.Get("https://api.arcaneodyssey.net/items")
	if err != nil {
		return fmt.Errorf("cannot fetch items: %w", err)
	}

	defer resp.Body.Close()

	respBytes, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		return fmt.Errorf("cannot read response body: %w", readErr)
	}

	unmarshalErr := json.Unmarshal(respBytes, &APIData)
	if unmarshalErr != nil {
		return fmt.Errorf("cannot unmarshal response body: %w", unmarshalErr)
	}

	file, fileErr := json.MarshalIndent(APIData, "", "  ")
	if fileErr != nil {
		return fmt.Errorf("cannot encode marshal response body: %w", fileErr)
	}

	writeErr := os.WriteFile("items.json", file, 0644)
	if writeErr != nil {
		return fmt.Errorf("cannot write file: %w", writeErr)
	}

	slog.Info("finished fetching data from API")
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
	slot.Enchantment = slotCodeArray[1]
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

func FindByID(id string) *Item {
	for _, v := range APIData {
		if v.ID == id {
			return &v
		}
	}

	return &Item{}
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

func EnchantmentIntoEmoji(item *Item) string {
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
	case "Resilient":
		return "<:resilient:1393732207155216404>"
	case "Piercing":
		return "<:piercing:1393732154491408507>"
	default:
		return ""
	}
}

func ModifierIntoEmoji(item *Item) string {
	switch item.Name {
	case "Abyssal":
		return "<:abyssal:1393733751279718591>"
	case "Archaic":
		return "<:archaic:1393733752877744178>"
	case "Atlantean":
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

func GemIntoEmoji(item *Item) string {
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
