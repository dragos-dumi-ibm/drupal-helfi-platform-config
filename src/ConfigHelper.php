<?php

namespace Drupal\helfi_platform_config;

use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Symfony\Component\Yaml\Yaml;

/**
 * Functions to handle configurations.
 *
 * @package Drupal\helfi_platform_config
 */
class ConfigHelper {

  /**
   * Install new configuration.
   *
   * @param string $config_location
   *   Absolute path to the configuration to be created.
   * @param string $config_name
   *   Name of the configuration to install.
   */
  public static function installNewConfig(string $config_location, string $config_name): void {
    $config_factory = \Drupal::configFactory();
    $filepath = "{$config_location}{$config_name}.yml";
    $data = Yaml::parse(file_get_contents($filepath));
    if (is_array($data)) {
      $config_factory->getEditable($config_name)->setData($data)->save(TRUE);
    }
  }

  /**
   * Install new field.
   *
   * @param string $config_location
   *   Absolute path to the configuration to be created.
   * @param string $field_storage
   *   Name of the field storage configuration to install.
   * @param string $field_config
   *   Name of the field configuration to install.
   */
  public static function installNewField(string $config_location, string $field_storage, string $field_config): void {
    // Install field storage configurations.
    if (isset($field_storage)) {
      $storage_data = Yaml::parse(file_get_contents("{$config_location}{$field_storage}.yml"));
      if (!FieldStorageConfig::loadByName($storage_data['entity_type'], $storage_data['field_name'])) {
        FieldStorageConfig::create($storage_data)->save();
      }
    }
    // Install field configurations.
    if (isset($field_config)) {
      $field_data = Yaml::parse(file_get_contents("{$config_location}{$field_config}.yml"));
      if (!FieldConfig::loadByName($field_data['entity_type'], $field_data['bundle'], $field_data['field_name'])) {
        FieldConfig::create($field_data)->save();
      }
    }
  }
}
