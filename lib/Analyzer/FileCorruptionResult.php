<?php

/**
 * @copyright Copyright (c) 2017 Matthias Held <matthias.held@uni-konstanz.de>
 * @author Matthias Held <matthias.held@uni-konstanz.de>
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

namespace OCA\RansomwareDetection\Analyzer;

class FileCorruptionResult
{
    /** @var bool */
    private $isCorrupted;

    /** @var int */
    private $fileClass;

    /**
     * @param bool $isCorrupted
     * @param int  $fileClass
     */
    public function __construct(
        $isCorrupted,
        $fileClass = -1
    ) {
        $this->isCorrupted = $isCorrupted;
        $this->fileClass = $fileClass;
    }

    /**
     * @param bool $isCorrupted
     */
    public function setCorrupted($isCorrupted)
    {
        $this->isCorrupted = $isCorrupted;
    }

    /**
     * @return bool
     */
    public function isCorrupted()
    {
        return $this->isCorrupted;
    }

    /**
     * @param int $fileClass
     */
    public function setFileClass($fileClass)
    {
        $this->fileClass = $fileClass;
    }

    /**
     * @return int
     */
    public function getFileClass()
    {
        return $this->fileClass;
    }
}