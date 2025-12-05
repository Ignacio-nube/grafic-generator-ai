"use client"

import type { IconButtonProps } from "@chakra-ui/react"
import { ClientOnly, IconButton, Skeleton, Text, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import * as React from "react"

interface LanguageToggleButtonProps extends Omit<IconButtonProps, "aria-label"> {}

export const LanguageToggleButton = React.forwardRef<
  HTMLButtonElement,
  LanguageToggleButtonProps
>(function LanguageToggleButton(props, ref) {
  const { i18n, t } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(newLang)
  }

  const currentFlag = i18n.language === 'es' ? '🇪🇸' : '🇺🇸'

  return (
    <ClientOnly fallback={<Skeleton boxSize="9" />}>
      <IconButton
        onClick={toggleLanguage}
        variant="ghost"
        aria-label={t('language.toggle')}
        size="sm"
        ref={ref}
        {...props}
        css={{
          fontSize: "lg",
        }}
      >
        {currentFlag}
      </IconButton>
    </ClientOnly>
  )
})

// Versión con texto para mostrar el idioma actual
interface LanguageToggleWithTextProps extends Omit<IconButtonProps, "aria-label"> {
  showText?: boolean
}

export const LanguageToggleWithText = React.forwardRef<
  HTMLButtonElement,
  LanguageToggleWithTextProps
>(function LanguageToggleWithText({ showText = true, ...props }, ref) {
  const { i18n, t } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(newLang)
  }

  const currentFlag = i18n.language === 'es' ? '🇪🇸' : '🇺🇸'
  const currentLang = i18n.language === 'es' ? 'ES' : 'EN'

  return (
    <ClientOnly fallback={<Skeleton boxSize="9" />}>
      <IconButton
        onClick={toggleLanguage}
        variant="ghost"
        aria-label={t('language.toggle')}
        size="sm"
        ref={ref}
        {...props}
        css={{
          fontSize: "md",
          minW: showText ? "auto" : "9",
          px: showText ? "2" : "0",
        }}
      >
        <HStack gap="1">
          <Text fontSize="lg">{currentFlag}</Text>
          {showText && <Text fontSize="xs" fontWeight="medium">{currentLang}</Text>}
        </HStack>
      </IconButton>
    </ClientOnly>
  )
})
