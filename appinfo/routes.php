<?php

/**
 * Create your routes in here. The name is the lowercase name of the controller
 * without the controller part, the stuff after the hash is the method.
 * e.g. page#index -> OCA\RansomwareDetection\Controller\PageController->index().
 *
 * The controller class has to be registered in the application.php file since
 * it's instantiated in there
 */
return [
    'routes' => [
        ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
        // File operation controller
        ['name' => 'fileOperation#findAll', 'url' => '/api/{apiVersion}/file-operation', 'verb' => 'GET', 'requirements' => ['apiVersion' => 'v1']],
        ['name' => 'fileOperation#find', 'url' => '/api/{apiVersion}/file-operation/{id}', 'verb' => 'GET', 'requirements' => ['apiVersion' => 'v1']],
        ['name' => 'fileOperation#recover', 'url' => '/api/{apiVersion}/file-operation/{id}/recover', 'verb' => 'PUT', 'requirements' => ['apiVersion' => 'v1']],
        // Settings controller
        ['name' => 'settings#update', 'url' => '/api/{apiVersion}/settings', 'verb' => 'PUT', 'requirements' => ['apiVersion' => 'v1']],
        ['name' => 'settings#findAll', 'url' => '/api/{apiVersion}/settings', 'verb' => 'GET', 'requirements' => ['apiVersion' => 'v1']],
        // Service controller
        ['name' => 'service#findAll', 'url' => '/api/{apiVersion}/service', 'verb' => 'GET', 'requirements' => ['apiVersion' => 'v1']],
        ['name' => 'service#find', 'url' => '/api/{apiVersion}/service/{id}', 'verb' => 'GET', 'requirements' => ['apiVersion' => 'v1']],
        // Detection controller
        ['name' => 'detection#findAll', 'url' => '/api/{apiVersion}/detection', 'verb' => 'GET', 'requirements' => ['apiVersion' => 'v1']],
        ['name' => 'detection#find', 'url' => '/api/{apiVersion}/detection/{id}', 'verb' => 'GET', 'requirements' => ['apiVersion' => 'v1']],
    ],
];
