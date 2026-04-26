package main

import (
	"encoding/json"
	"fmt"
	"strings"
)

type Config struct {
	IPReportPeriod int `json:"ip_report_period"`
}

func main() {
	jsonData := `{"ip_report_period":30, "unknown_field": 123}`
	var c Config
	
	dec := json.NewDecoder(strings.NewReader(jsonData))
	dec.DisallowUnknownFields()
	err := dec.Decode(&c)
	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Println("Success")
	}
}
