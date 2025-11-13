#!/bin/bash

# Output file
OUTPUT_FILE="casino_data.txt"

# Clear the output file
> "$OUTPUT_FILE"

# Function to fetch and format data for a casino
fetch_casino_data() {
    local casino_name="$1"
    shift
    local urls=("$@")

    echo "==========
$casino_name
==========" >> "$OUTPUT_FILE"

    for url in "${urls[@]}"; do
        echo "" >> "$OUTPUT_FILE"
        echo "URL: $url" >> "$OUTPUT_FILE"
        echo "---" >> "$OUTPUT_FILE"
        curl -s -L "$url" >> "$OUTPUT_FILE" 2>&1
        echo "" >> "$OUTPUT_FILE"
    done

    echo "" >> "$OUTPUT_FILE"
}

# Caesars
fetch_casino_data "CAESARS.COM" \
    "https://caesars.com/AbpUserConfiguration/GetAll" \
    "https://caesars.com/abpuserconfiguration/getall" \
    "https://caesars.com/api/AbpUserConfiguration/GetAll"

# PartyPoker
fetch_casino_data "PARTYPOKER.COM" \
    "https://partypoker.com/api/AbpUserConfiguration/GetAll"

# Binance
fetch_casino_data "BINANCE.COM" \
    "https://binance.com/AbpUserConfiguration/GetAll" \
    "https://binance.com/abpuserconfiguration/getall" \
    "https://binance.com/api/AbpUserConfiguration/GetAll"

# Crypto.com
fetch_casino_data "CRYPTO.COM" \
    "https://crypto.com/AbpUserConfiguration/GetAll" \
    "https://crypto.com/abpuserconfiguration/getall" \
    "https://crypto.com/api/AbpUserConfiguration/GetAll"

# BitCasino
fetch_casino_data "BITCASINO.IO" \
    "https://bitcasino.io/AbpUserConfiguration/GetAll" \
    "https://bitcasino.io/abpuserconfiguration/getall" \
    "https://bitcasino.io/api/AbpUserConfiguration/GetAll"

# SportsBet
fetch_casino_data "SPORTSBET.IO" \
    "https://sportsbet.io/AbpUserConfiguration/GetAll" \
    "https://sportsbet.io/abpuserconfiguration/getall" \
    "https://sportsbet.io/api/AbpUserConfiguration/GetAll"

# MyStake
fetch_casino_data "MYSTAKE.COM" \
    "https://mystake.com/abpuserconfiguration/getall" \
    "https://mystake.com/api/AbpUserConfiguration/GetAll"

# 7bit Casino
fetch_casino_data "7BIT.CASINO" \
    "https://7bit.casino/AbpUserConfiguration/GetAll" \
    "https://7bit.casino/abpuserconfiguration/getall" \
    "https://7bit.casino/api/AbpUserConfiguration/GetAll"

# Mirax
fetch_casino_data "MIRAX.IO" \
    "https://mirax.io/AbpUserConfiguration/GetAll" \
    "https://mirax.io/abpuserconfiguration/getall" \
    "https://mirax.io/api/AbpUserConfiguration/GetAll"

# Vegasino
fetch_casino_data "VEGASINO.COM" \
    "https://vegasino.com/AbpUserConfiguration/GetAll" \
    "https://vegasino.com/abpuserconfiguration/getall" \
    "https://vegasino.com/api/AbpUserConfiguration/GetAll"

# BetPanda
fetch_casino_data "BETPANDA.IO" \
    "https://betpanda.io/AbpUserConfiguration/GetAll" \
    "https://betpanda.io/abpuserconfiguration/getall" \
    "https://betpanda.io/api/AbpUserConfiguration/GetAll"

# Vave
fetch_casino_data "VAVE.COM" \
    "https://vave.com/AbpUserConfiguration/GetAll" \
    "https://vave.com/abpuserconfiguration/getall"

# Smokace
fetch_casino_data "SMOKACE.COM" \
    "https://smokace.com/AbpUserConfiguration/GetAll" \
    "https://smokace.com/abpuserconfiguration/getall" \
    "https://smokace.com/api/AbpUserConfiguration/GetAll"

# BDMBet
fetch_casino_data "BDMBET.COM" \
    "https://bdmbet.com/AbpUserConfiguration/GetAll" \
    "https://bdmbet.com/abpuserconfiguration/getall" \
    "https://bdmbet.com/api/AbpUserConfiguration/GetAll"

# Wazamba
fetch_casino_data "WAZAMBA.COM" \
    "https://wazamba.com/AbpUserConfiguration/GetAll" \
    "https://wazamba.com/api/AbpUserConfiguration/GetAll"

# CosmoBet
fetch_casino_data "COSMOBET.COM" \
    "https://cosmobet.com/AbpUserConfiguration/GetAll" \
    "https://cosmobet.com/abpuserconfiguration/getall" \
    "https://cosmobet.com/api/AbpUserConfiguration/GetAll"

# SlotsVil
fetch_casino_data "SLOTSVIL.COM" \
    "https://slotsvil.com/api/AbpUserConfiguration/GetAll"

# ZetCasino
fetch_casino_data "ZETCASINO.COM" \
    "https://zetcasino.com/AbpUserConfiguration/GetAll" \
    "https://zetcasino.com/abpuserconfiguration/getall" \
    "https://zetcasino.com/api/AbpUserConfiguration/GetAll"

# BooCasino
fetch_casino_data "BOOCASINO.COM" \
    "https://boocasino.com/AbpUserConfiguration/GetAll" \
    "https://boocasino.com/abpuserconfiguration/getall" \
    "https://boocasino.com/api/AbpUserConfiguration/GetAll"

# FreshBet
fetch_casino_data "FRESHBET.COM" \
    "https://freshbet.com/AbpUserConfiguration/GetAll" \
    "https://freshbet.com/abpuserconfiguration/getall" \
    "https://freshbet.com/api/AbpUserConfiguration/GetAll"

# SpinsBro
fetch_casino_data "SPINSBRO.COM" \
    "https://spinsbro.com/AbpUserConfiguration/GetAll" \
    "https://spinsbro.com/abpuserconfiguration/getall" \
    "https://spinsbro.com/api/AbpUserConfiguration/GetAll"

# LuckyLand Slots
fetch_casino_data "LUCKYLANDSLOTS.COM" \
    "https://luckylandslots.com/AbpUserConfiguration/GetAll" \
    "https://luckylandslots.com/abpuserconfiguration/getall" \
    "https://luckylandslots.com/api/AbpUserConfiguration/GetAll"

# Fortune Coins
fetch_casino_data "FORTUNECOINS.COM" \
    "https://fortunecoins.com/api/AbpUserConfiguration/GetAll"

# Zula Casino
fetch_casino_data "ZULA.CASINO" \
    "https://zula.casino/AbpUserConfiguration/GetAll" \
    "https://zula.casino/abpuserconfiguration/getall" \
    "https://zula.casino/api/AbpUserConfiguration/GetAll"

# LuckyBird
fetch_casino_data "LUCKYBIRD.IO" \
    "https://luckybird.io/AbpUserConfiguration/GetAll" \
    "https://luckybird.io/abpuserconfiguration/getall"

# Jubise
fetch_casino_data "JUBISE.COM" \
    "https://jubise.com/AbpUserConfiguration/GetAll" \
    "https://jubise.com/abpuserconfiguration/getall" \
    "https://jubise.com/api/AbpUserConfiguration/GetAll"

# Sportzino
fetch_casino_data "SPORTZINO.COM" \
    "https://sportzino.com/AbpUserConfiguration/GetAll" \
    "https://sportzino.com/api/AbpUserConfiguration/GetAll"

# Slotomania
fetch_casino_data "SLOTTOMANIA.COM" \
    "https://slottomania.com/AbpUserConfiguration/GetAll" \
    "https://slottomania.com/abpuserconfiguration/getall" \
    "https://slottomania.com/api/AbpUserConfiguration/GetAll"

# DoubleDown Casino
fetch_casino_data "DOUBLEDOWNCASINO.COM" \
    "https://doubledowncasino.com/AbpUserConfiguration/GetAll" \
    "https://doubledowncasino.com/abpuserconfiguration/getall" \
    "https://doubledowncasino.com/api/AbpUserConfiguration/GetAll"

# SlotsLV
fetch_casino_data "SLOTSLV.COM" \
    "https://slotslv.com/AbpUserConfiguration/GetAll" \
    "https://slotslv.com/abpuserconfiguration/getall" \
    "https://slotslv.com/api/AbpUserConfiguration/GetAll"

echo "Data collection complete! Results saved to $OUTPUT_FILE"
