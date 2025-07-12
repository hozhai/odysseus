package main

import (
	"fmt"
	"github.com/disgoorg/json"
	"io"
	"log/slog"
	"net/http"
	"os"
)

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

func UnhashBuildCode(code string) {

}
