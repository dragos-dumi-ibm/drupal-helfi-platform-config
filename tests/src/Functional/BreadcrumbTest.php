<?php

declare(strict_types = 1);

namespace Drupal\Tests\helfi_platform_config\Functional;

use Drupal\language\Entity\ConfigurableLanguage;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\node\NodeInterface;
use Drupal\Tests\BrowserTestBase;
use Drupal\Tests\system\Functional\Menu\AssertBreadcrumbTrait;

/**
 * Tests breadcrumb.
 *
 * @group helfi_platform_config
 */
class BreadcrumbTest extends BrowserTestBase {

  use AssertBreadcrumbTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'language',
    'content_translation',
    'node',
    'block',
    'helfi_platform_config',
  ];

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * The node.
   *
   * @var \Drupal\node\NodeInterface|null
   */
  protected ?NodeInterface $node;

  /**
   * {@inheritdoc}
   */
  public function setUp() : void {
    parent::setUp();

    foreach (['fi', 'sv'] as $langcode) {
      ConfigurableLanguage::createFromLangcode($langcode)->save();
    }
    $this->config('language.negotiation')
      ->set('url.prefixes', ['en' => 'en', 'fi' => 'fi', 'sv' => 'sv'])
      ->save();

    NodeType::create([
      'type' => 'page',
    ])->save();

    $this->drupalPlaceBlock('system_breadcrumb_block', [
      'region' => 'content',
      'theme' => $this->defaultTheme,
    ]);

    $this->node = Node::create(['type' => 'page', 'title' => 'Title en']);
    $this->node->save();

    foreach (['fi', 'sv'] as $language) {
      $this->node->addTranslation($language, [
        'title' => 'Title ' . $language,
      ]);
    }
    $this->node->save();
  }

  /**
   * Tests that breadcrumb link is added.
   */
  public function testBreadcrumb() : void {
    // Make sure first item is always link to hel.fi Etusivu instance.
    foreach (['en' => 'Frontpage', 'sv' => 'Framsida', 'fi' => 'Etusivu'] as $language => $title) {
      $this->drupalGet('/' . $language);
      $parts = $this->getBreadcrumbParts();
      $this->assertEquals($title, $parts[0]['text']);

      $this->drupalGet('/' . $language . '/node/' . $this->node->id());
      $parts = $this->getBreadcrumbParts();
      $this->assertEquals($title, $parts[0]['text']);
    }
  }

}
