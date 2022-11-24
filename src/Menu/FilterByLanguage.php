<?php

declare(strict_types = 1);

namespace Drupal\helfi_platform_config\Menu;

use Drupal\Core\Menu\MenuLinkTreeManipulatorsAlterEvent;
use Drupal\Core\Routing\AdminContext;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Filters out the untranslated menu links.
 *
 * @note this requires a patch from #3091246.
 */
final class FilterByLanguage implements EventSubscriberInterface {

  /**
   * List of menu names to filter.
   *
   * @var string[]
   */
  protected $menuNames = [
    'branding-navigation',
    'footer-bottom-navigation',
    'footer-top-navigation',
    'footer-top-navigation-2',
    'header-top-navigation',
    'header-language-links',
    'main',
  ];

  /**
   * Constructs a new instance.
   *
   * @param \Drupal\Core\Routing\AdminContext $adminContext
   *   The admin context service.
   */
  public function __construct(private AdminContext $adminContext) {
  }

  /**
   * Responds to MenuLinkTreeEvents::ALTER_MANUPULATORS event.
   *
   * @param \Drupal\Core\Menu\MenuLinkTreeManipulatorsAlterEvent $event
   *   The event to subscribe to.
   */
  public function filter(MenuLinkTreeManipulatorsAlterEvent $event) : void {
    if (!$this->adminContext->isAdminRoute()) {
      return;
    }
    $manipulators = &$event->getManipulators();

    $menuName = NULL;
    foreach ($event->getTree() as $item) {
      if (!$item->link) {
        continue;
      }
      $menuName = $item->link->getMenuName();
      break;
    }

    if (!in_array($menuName, $this->menuNames)) {
      return;
    }

    $manipulators[] = [
      'callable' => 'menu_block_current_language_tree_manipulator::filterLanguages',
      'args' => [['menu_link_content']],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() : array {
    return [
      'menu.link_tree.alter_manipulators' => [
        ['filter'],
      ],
    ];
  }

}
