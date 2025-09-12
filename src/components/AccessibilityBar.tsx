import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Type, 
  Contrast, 
  Languages, 
  Accessibility,
  Volume2,
  PauseCircle,
  PlayCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useState } from "react";

export const AccessibilityBar = () => {
  const { t, currentLanguage, languages, changeLanguage } = useLanguage();
  const { fontSize, isHighContrast, setFontSize, toggleHighContrast } = useAccessibility();
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  const toggleScreenReader = () => {
    setIsScreenReaderActive(!isScreenReaderActive);
    // In a real implementation, this would integrate with screen reader APIs
  };

  return (
    <div className="bg-primary text-primary-foreground py-2 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between text-sm">
          {/* Skip to content link for screen readers */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary-foreground text-primary px-3 py-1 rounded z-50"
          >
            {t('accessibility.skipToMain')}
          </a>

          <div className="flex items-center space-x-1">
            <Badge variant="secondary" className="text-xs">
              {t('language.current')}: {currentLanguage.nativeName}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Languages className="h-3 w-3 mr-1" />
                  {currentLanguage.code.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
                {languages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => changeLanguage(language.code)}
                    className={currentLanguage.code === language.code ? "bg-accent" : ""}
                  >
                    <span className="font-medium">{language.nativeName}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{language.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Font Size */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Type className="h-3 w-3 mr-1" />
                  A
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setFontSize('normal')}
                  className={fontSize === 'normal' ? "bg-accent" : ""}
                >
                  {t('accessibility.fontNormal')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFontSize('large')}
                  className={fontSize === 'large' ? "bg-accent" : ""}
                >
                  {t('accessibility.fontLarge')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFontSize('extra-large')}
                  className={fontSize === 'extra-large' ? "bg-accent" : ""}
                >
                  {t('accessibility.fontExtraLarge')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* High Contrast */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleHighContrast}
              className={`text-primary-foreground hover:bg-primary-foreground/10 ${
                isHighContrast ? 'bg-primary-foreground/20' : ''
              }`}
            >
              <Contrast className="h-3 w-3 mr-1" />
              {isHighContrast ? 'ON' : 'OFF'}
            </Button>

            {/* Screen Reader */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleScreenReader}
              className={`text-primary-foreground hover:bg-primary-foreground/10 ${
                isScreenReaderActive ? 'bg-primary-foreground/20' : ''
              }`}
              aria-label="Toggle Screen Reader"
            >
              {isScreenReaderActive ? (
                <PauseCircle className="h-3 w-3" />
              ) : (
                <PlayCircle className="h-3 w-3" />
              )}
            </Button>

            {/* Accessibility Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Accessibility className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open('https://web.archive.org/web/20231201000000*/accessibility-policy.pdf', '_blank')}>
                  Accessibility Policy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('mailto:accessibility@india.gov.in')}>
                  Report Accessibility Issue
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://web.archive.org/web/20231201000000*/keyboard-shortcuts.html', '_blank')}>
                  Keyboard Shortcuts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};