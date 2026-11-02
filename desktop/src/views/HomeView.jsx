import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { Card } from '@astryxdesign/core/Card';
import { useT } from '../i18n.js';
import { MessBadge, RelativeTime, SectionHeading } from '../components/common.jsx';
import { PickFolderIcon, ProjectIcon } from '../icons.jsx';
import { ProjectContextMenu, ProjectMoreButton } from '../components/ProjectMenu.jsx';
import { Emoji } from '../components/Emoji.jsx';

export function HomeView({ recentProjects, onPick, projectActions }) {
  const t = useT();

  return (
    <Layout
      height="fill"
      contentWidth={860}
      content={
        <LayoutContent padding={8}>
          <VStack gap={10}>
            <div className="home-hero">
              <Emoji name="cherry-blossom" size={64} className="home-hero-mark" />
              <VStack gap={3} hAlign="center">
                <Heading level={1}>{t('home_title')}</Heading>
                <Text color="secondary" justify="center">
                  {t('home_subtitle')}
                </Text>
              </VStack>
              <Button
                label={t('home_choose')}
                variant="primary"
                size="lg"
                icon={<Icon icon={PickFolderIcon} size="sm" />}
                onClick={onPick}
              />
              <Text type="supporting" color="secondary">
                {t('home_drop')}
              </Text>
            </div>

            <VStack gap={4}>
              <SectionHeading title={t('nav_recent')} />
              {recentProjects.length === 0 ? (
                <Text color="secondary">{t('home_recent_empty')}</Text>
              ) : (
                <Card padding={0}>
                  <ul className="recent-list">
                    {recentProjects.map((project) => (
                      <li key={project.path}>
                        <ProjectContextMenu project={project} actions={projectActions}>
                          <div className="recent-row">
                            <button
                              type="button"
                              className="recent-main"
                              onClick={() => projectActions.onOpen(project.path)}
                            >
                              <Icon icon={ProjectIcon} size="md" color="secondary" />
                              <StackItem size="fill">
                                <VStack gap={0.5}>
                                  <Text weight="semibold" maxLines={1}>
                                    {project.name}
                                  </Text>
                                  <Text type="supporting" color="secondary" maxLines={1}>
                                    {project.path}
                                  </Text>
                                </VStack>
                              </StackItem>
                              <HStack gap={3} vAlign="center">
                                <RelativeTime value={project.analyzedAt} />
                                <MessBadge mess={project.score} />
                              </HStack>
                            </button>
                            <span className="recent-more">
                              <ProjectMoreButton project={project} actions={projectActions} />
                            </span>
                          </div>
                        </ProjectContextMenu>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </VStack>

            <Text type="supporting" color="secondary" justify="center">
              {t('home_languages')}
            </Text>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
