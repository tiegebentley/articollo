"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const languages = [
  { name: "Albanian", code: "SQ" },
  { name: "Arabic", code: "AR" },
  { name: "Armenian", code: "HY" },
  { name: "Azeri", code: "AZ" },
  { name: "Bengali", code: "BN" },
  { name: "Bosnian", code: "BS" },
  { name: "Bulgarian", code: "BG" },
  { name: "Chinese (Simplified)", code: "ZH" },
  { name: "Chinese (Traditional)", code: "ZH" },
  { name: "Croatian", code: "HR" },
  { name: "Czech", code: "CS" },
  { name: "Danish", code: "DA" },
  { name: "Dutch", code: "NL" },
  { name: "English", code: "EN" },
  { name: "Estonian", code: "ET" },
  { name: "Finnish", code: "FI" },
  { name: "French", code: "FR" },
  { name: "German", code: "DE" },
  { name: "Greek", code: "EL" },
  { name: "Hebrew", code: "HE" },
  { name: "Hindi", code: "HI" },
  { name: "Hungarian", code: "HU" },
  { name: "Indonesian", code: "ID" },
  { name: "Italian", code: "IT" },
  { name: "Japanese", code: "JA" },
  { name: "Korean", code: "KO" },
  { name: "Latvian", code: "LV" },
  { name: "Lithuanian", code: "LT" },
  { name: "Macedonian", code: "MK" },
  { name: "Malay", code: "MS" },
  { name: "Norwegian (Bokmål)", code: "NO" },
  { name: "Polish", code: "PL" },
  { name: "Portuguese", code: "PT" },
  { name: "Romanian", code: "RO" },
  { name: "Russian", code: "RU" },
  { name: "Serbian", code: "SR" },
  { name: "Slovak", code: "SK" },
  { name: "Slovenian", code: "SL" },
  { name: "Spanish", code: "ES" },
  { name: "Swedish", code: "SV" },
  { name: "Tagalog", code: "TL" },
  { name: "Thai", code: "TH" },
  { name: "Turkish", code: "TR" },
  { name: "Ukrainian", code: "UK" },
  { name: "Urdu", code: "UR" },
  { name: "Vietnamese", code: "VI" },
]

interface LanguageSelectorProps {
  onSelectionChange?: (language: { name: string; code: string }) => void
}

export function LanguageSelector({ onSelectionChange }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(languages.find((l) => l.code === "EN") || languages[0])

  const handleLanguageSelect = (language: (typeof languages)[0]) => {
    setSelectedLanguage(language)
    onSelectionChange?.(language)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <span className="text-xs font-semibold">{selectedLanguage.code}</span>
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language)}
            className={`cursor-pointer ${selectedLanguage.code === language.code ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`}
          >
            <span className="flex justify-between w-full">
              <span>{language.name}</span>
              <span className="text-xs text-gray-500">{language.code}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
