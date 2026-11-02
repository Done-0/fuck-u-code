import { useState } from 'react';
import { Layout, LayoutContent, LayoutHeader } from '@astryxdesign/core/Layout';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Card } from '@astryxdesign/core/Card';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { useToast } from '@astryxdesign/core/Toast';
import { LOCALE_OPTIONS, useT } from '../i18n.js';
import { PROVIDERS } from '../providers.js';
import { RefreshIcon } from '../icons.jsx';
import { Emoji } from '../components/Emoji.jsx';
import { SuggestInput } from '../components/SuggestInput.jsx';

// Each section has its own hue so the pages are easy to tell apart.
const SECTIONS = [
  { id: 'general', title: 'settings_general', hue: 'blue' },
  { id: 'analysis', title: 'settings_analysis', hue: 'teal' },
  { id: 'ai', title: 'settings_ai', hue: 'purple' },
  { id: 'about', title: 'settings_about', hue: 'pink' },
];

const THEMES = ['system', 'light', 'dark'];
const PLATFORM_NAMES = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' };
const HOMEPAGE = 'https://github.com/Done-0/fuck-u-code';

function SectionHeader({ title, description }) {
  return (
    <div className="section-header">
      <VStack gap={1}>
        <Heading level={2}>{title}</Heading>
        {description && (
          <Text type="supporting" color="secondary">
            {description}
          </Text>
        )}
      </VStack>
    </div>
  );
}

/** One setting: explanation on the left, control on the right (or below when stacked). */
function SettingRow({ step, label, description, stacked, children }) {
  return (
    <div className={`setting-row${stacked ? ' is-stacked' : ''}`}>
      <div className="setting-row-text">
        <div className="setting-row-label">
          {step && <span className="step-badge">{step}</span>}
          <Text weight="semibold">{label}</Text>
        </div>
        {description && (
          <Text type="supporting" color="secondary">
            {description}
          </Text>
        )}
      </div>
      <div className="setting-row-control">{children}</div>
    </div>
  );
}

function SaveBar({ isDirty, isSaving, onDiscard, onSave }) {
  const t = useT();
  return (
    <div className={`save-bar${isDirty ? ' is-dirty' : ''}`}>
      <Text type="supporting" color="secondary">
        {isDirty ? t('settings_unsaved') : ''}
      </Text>
      <HStack gap={2}>
        <Button
          label={t('settings_discard')}
          variant="ghost"
          isDisabled={!isDirty}
          onClick={onDiscard}
        />
        <Button
          label={t('settings_save')}
          variant="primary"
          isDisabled={!isDirty}
          isLoading={isSaving}
          onClick={onSave}
        />
      </HStack>
    </div>
  );
}

function ThemePicker({ value, onChange }) {
  const t = useT();
  return (
    <div className="theme-picker" role="radiogroup" aria-label={t('settings_theme')}>
      {THEMES.map((theme) => (
        <button
          key={theme}
          type="button"
          role="radio"
          aria-checked={value === theme}
          className={`theme-option${value === theme ? ' is-selected' : ''}`}
          onClick={() => onChange(theme)}
        >
          <span className={`theme-preview theme-preview-${theme}`} aria-hidden="true">
            <span className="tp-nav" />
            <span className="tp-body">
              <span className="tp-line" />
              <span className="tp-line is-short" />
            </span>
          </span>
          <span className="theme-option-label">{t(`theme_${theme}`)}</span>
        </button>
      ))}
    </div>
  );
}

function GeneralSection({ settings, onSave }) {
  const t = useT();
  return (
    <Card padding={0}>
      <SettingRow label={t('settings_language')} description={t('settings_language_desc')}>
        <Selector
          label={t('settings_language')}
          isLabelHidden
          options={LOCALE_OPTIONS}
          value={settings.locale}
          onChange={(locale) => onSave({ locale })}
          width={220}
        />
      </SettingRow>
      <SettingRow label={t('settings_theme')} description={t('settings_theme_desc')}>
        <ThemePicker value={settings.theme} onChange={(theme) => onSave({ theme })} />
      </SettingRow>
    </Card>
  );
}

function AnalysisSection({ settings, save, savingSection }) {
  const t = useT();
  const savedExclude = settings.exclude.join('\n');
  const [concurrency, setConcurrency] = useState(settings.concurrency);
  const [exclude, setExclude] = useState(savedExclude);
  const isDirty = concurrency !== settings.concurrency || exclude.trim() !== savedExclude;

  return (
    <VStack gap={4}>
      <Card padding={0}>
        <SettingRow label={t('settings_concurrency')} description={t('settings_concurrency_desc')}>
          <NumberInput
            label={t('settings_concurrency')}
            isLabelHidden
            value={concurrency}
            min={1}
            max={32}
            onChange={(value) => setConcurrency(value ?? 8)}
            width={120}
          />
        </SettingRow>
        <SettingRow label={t('settings_exclude')} description={t('settings_exclude_desc')} stacked>
          <TextArea
            label={t('settings_exclude')}
            isLabelHidden
            value={exclude}
            onChange={setExclude}
            rows={5}
            placeholder={'**/*.test.ts\nvendor/**'}
            hasSpellCheck={false}
            className="code-textarea"
          />
        </SettingRow>
      </Card>
      <SaveBar
        isDirty={isDirty}
        isSaving={savingSection === 'analysis'}
        onDiscard={() => {
          setConcurrency(settings.concurrency);
          setExclude(savedExclude);
        }}
        onSave={() => save('analysis', { concurrency, exclude: exclude.split('\n') })}
      />
    </VStack>
  );
}

function AISection({ settings, save, savingSection }) {
  const t = useT();
  const saved = settings.ai;
  const [provider, setProvider] = useState(saved.provider);
  const [baseUrl, setBaseUrl] = useState(saved.baseUrl);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(saved.model);
  const [models, setModels] = useState([]);
  const [fetchState, setFetchState] = useState({ status: 'idle' });

  const isDirty =
    provider !== saved.provider ||
    baseUrl !== saved.baseUrl ||
    model !== saved.model ||
    apiKey.trim() !== '';

  const changeProvider = (next) => {
    setProvider(next);
    // Model names do not carry over between providers.
    setModels([]);
    setModel('');
    setFetchState({ status: 'idle' });
  };

  const fetchModels = async () => {
    setFetchState({ status: 'loading' });
    try {
      const list = await window.fuc.listModels({ provider, baseUrl, apiKey: apiKey.trim() });
      setModels(list);
      setFetchState({ status: list.length ? 'done' : 'empty', count: list.length });
      if (list.length && !model) setModel(list[0]);
    } catch (error) {
      setFetchState({ status: 'error', message: error.message });
    }
  };

  const reset = () => {
    setProvider(saved.provider);
    setBaseUrl(saved.baseUrl);
    setApiKey('');
    setModel(saved.model);
    setModels([]);
    setFetchState({ status: 'idle' });
  };

  return (
    <VStack gap={4}>
      <Card padding={0}>
        <SettingRow
          step="1"
          label={t('settings_provider')}
          description={t('settings_provider_desc')}
        >
          <Selector
            label={t('settings_provider')}
            isLabelHidden
            options={PROVIDERS}
            value={provider}
            onChange={changeProvider}
            width={260}
          />
        </SettingRow>
        <SettingRow
          step="2"
          label={t('settings_base_url')}
          description={t('settings_base_url_desc')}
        >
          <TextInput
            label={t('settings_base_url')}
            isLabelHidden
            value={baseUrl}
            onChange={setBaseUrl}
            placeholder={t('settings_base_url_placeholder')}
            width={320}
          />
        </SettingRow>
        <SettingRow step="3" label={t('settings_api_key')} description={t('settings_api_key_desc')}>
          <VStack gap={2}>
            <TextInput
              type="password"
              label={t('settings_api_key')}
              isLabelHidden
              value={apiKey}
              onChange={setApiKey}
              placeholder={saved.hasApiKey ? '••••••••••••••••' : t('settings_api_key_placeholder')}
              autoComplete="off"
              width={320}
            />
            {saved.hasApiKey && (
              <HStack gap={2} vAlign="center">
                <Badge variant="success" label={t('ai_key_saved')} />
                <Button
                  label={t('settings_api_key_clear')}
                  variant="ghost"
                  size="sm"
                  isLoading={savingSection === 'clear'}
                  onClick={() => save('clear', { ai: { clearApiKey: true } })}
                />
              </HStack>
            )}
          </VStack>
        </SettingRow>
        <SettingRow step="4" label={t('settings_model')} description={t('settings_model_desc')}>
          <VStack gap={2}>
            <HStack gap={2} vAlign="center">
              <SuggestInput
                label={t('settings_model')}
                value={model}
                onChange={setModel}
                suggestions={models}
                placeholder={models.length ? t('settings_model_placeholder') : 'gpt-4o'}
                width={260}
              />
              <Button
                label={t('settings_fetch_models')}
                variant="secondary"
                icon={<Icon icon={RefreshIcon} size="sm" />}
                isLoading={fetchState.status === 'loading'}
                onClick={fetchModels}
              />
            </HStack>
            <HStack gap={3} vAlign="center" wrap="wrap">
              {fetchState.status === 'done' && (
                <Text type="supporting" color="secondary">
                  {t('settings_models_found', { count: fetchState.count })}
                </Text>
              )}
              {fetchState.status === 'empty' && (
                <Text type="supporting" color="secondary">
                  {t('settings_models_empty')}
                </Text>
              )}
              {fetchState.status === 'error' && (
                <p className="text-error fetch-error">{fetchState.message}</p>
              )}
            </HStack>
          </VStack>
        </SettingRow>
      </Card>
      <SaveBar
        isDirty={isDirty}
        isSaving={savingSection === 'ai'}
        onDiscard={reset}
        onSave={async () => {
          if (await save('ai', { ai: { provider, baseUrl, model, apiKey } })) setApiKey('');
        }}
      />
    </VStack>
  );
}

function AboutSection({ appInfo }) {
  const t = useT();
  if (!appInfo) return null;
  return (
    <Card padding={0}>
      <div className="about-hero">
        <span className="about-mark">
          <Emoji name="cherry-blossom" size={44} />
        </span>
        <VStack gap={2}>
          <Heading level={2}>fuck-u-code</Heading>
          <Text color="secondary">{t('report_title')}</Text>
          <HStack gap={2} wrap="wrap">
            <Badge variant="neutral" label={`${t('about_desktop')} ${appInfo.version}`} />
            <Badge variant="neutral" label={`${t('about_engine')} ${appInfo.coreVersion}`} />
          </HStack>
        </VStack>
      </div>
      <SettingRow label={t('about_homepage')}>
        <a className="text-link" href={HOMEPAGE} target="_blank" rel="noreferrer">
          github.com/Done-0/fuck-u-code
        </a>
      </SettingRow>
      <SettingRow label={t('about_license')}>
        <Text>MIT</Text>
      </SettingRow>
      <SettingRow label={t('about_credits')}>
        <Text>Phosphor Icons · Microsoft Fluent Emoji (MIT)</Text>
      </SettingRow>
      <SettingRow label={t('about_runtime')}>
        <Text>
          {[
            appInfo.electronVersion && `Electron ${appInfo.electronVersion}`,
            PLATFORM_NAMES[appInfo.platform] ?? appInfo.platform,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </SettingRow>
    </Card>
  );
}

export function SettingsView({ settings, appInfo, onSave, section, onSectionChange }) {
  const t = useT();
  const showToast = useToast();
  const [savingSection, setSavingSection] = useState(null);
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  // Returns whether the save went through, so forms can reset their drafts.
  const save = async (id, patch) => {
    setSavingSection(id);
    try {
      await onSave(patch);
      showToast({ body: t('settings_saved'), type: 'info' });
      return true;
    } catch (error) {
      showToast({ body: error.message, type: 'error' });
      return false;
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <Layout
      height="fill"
      contentWidth={1080}
      header={
        <LayoutHeader padding={6} hasDivider>
          <VStack gap={1}>
            <Heading level={1}>{t('settings_title')}</Heading>
            <Text type="supporting" color="secondary">
              {t('settings_subtitle')}
            </Text>
          </VStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <div className="settings-layout">
            <nav className="settings-nav" aria-label={t('settings_title')}>
              {SECTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`settings-nav-item hue-${item.hue}${item.id === current.id ? ' is-selected' : ''}`}
                  aria-current={item.id === current.id ? 'page' : undefined}
                  onClick={() => onSectionChange(item.id)}
                >
                  <span className="settings-nav-text">
                    <span className="settings-nav-title">{t(item.title)}</span>
                    <span className="settings-nav-desc">{t(`settings_nav_${item.id}_desc`)}</span>
                  </span>
                </button>
              ))}
            </nav>

            <div className={`settings-panel hue-${current.hue}`}>
              <VStack gap={5}>
                <SectionHeader
                  title={t(current.title)}
                  description={
                    {
                      general: t('settings_general_desc'),
                      analysis: t('settings_analysis_desc'),
                      ai: t('settings_ai_desc'),
                      about: null,
                    }[current.id]
                  }
                />
                {current.id === 'general' && <GeneralSection settings={settings} onSave={onSave} />}
                {current.id === 'analysis' && (
                  <AnalysisSection settings={settings} save={save} savingSection={savingSection} />
                )}
                {current.id === 'ai' && (
                  <AISection settings={settings} save={save} savingSection={savingSection} />
                )}
                {current.id === 'about' && <AboutSection appInfo={appInfo} />}
              </VStack>
            </div>
          </div>
        </LayoutContent>
      }
    />
  );
}
