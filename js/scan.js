/**
 * @copyright Copyright (c) 2018 Matthias Held <matthias.held@uni-konstanz.de>
 *
 * @author Matthias Held <matthias.held@uni-konstanz.de>
 *
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

(function() {

    /**
     * @class OCA.RansomwareDetection.Scan
     */
    var Scan = function($el, options) {
        this.initialize($el, options);
    };

    /**
     * @memberof OCA.RansomwareDetection
     */
    Scan.prototype = {
        id: 'ransomware_detection',
        appName: t('ransomware_detection', 'Ransomware Detection'),
        $el: null,
        $section: null,
        $table: null,
        $fileList: null,
        debug: 0,
        filesToScan: {},
        sequencesToScan: {},
        colors: {red: 'red', orange: 'orange', yellow: 'yellow', green: 'green'},
        colorsText: {red: 'red-text', orange: 'orange-text', yellow: 'yellow-text', green: 'green-text'},

        /**
		 * Map of file id to file data
		 * @type Object.<int, Object>
		 */
		_selectedFiles: {},

        /**
		 * Map of files in the current folder.
		 * The entries are of file data.
		 *
		 * @type Object.<int, Object>
		 */
		files: {},

        /**
         * Initialize the file list and its components
         */
        initialize: function($el, options) {
            var self = this;
            options = options || {};
            if (this.initialized) {
                return;
            }
            this.$el = $el;
            if (options.id) {
				this.id = options.id;
			}

            this.filesUrl = '/ocs/v2.php/apps/' + this.id + '/api/v1/files-to-scan';
            this.recoveryUrl = '/ocs/v2.php/apps/' + this.id + '/api/v1/scan-recover';
            this.scanSequenceUrl = '/ocs/v2.php/apps/' + this.id + '/api/v1/scan-sequence';
            this.getColorModeUrl = '/ocs/v2.php/apps/' + this.id + '/api/v1/get-color-mode';
            this.getDebugModeUrl = '/ocs/v2.php/apps/' + this.id + '/api/v1/get-debug-mode';
            this.$container = options.scrollContainer || $(window);
            this.$section = {};
            this.$table = {};
            this.$fileList = {};

            $.getJSON(self.getDebugModeUrl, function(debug) {
                if (debug.debug_mode == 1) {
                    console.log('Debug mode active.');
                    self.debug = 1;
                }
                $.getJSON(self.filesUrl, function(data) {
                    console.log("Create scan header.");
                    $('#section-loading').remove();
                    console.log("Scanned " + data.number_of_files + " files in " + data.scan_duration + " seconds.");
                    self.$el.append(self._createScanHeader(data.sequences.length));
                    self.sequencesToScan = data.sequences;
                });
            });

            this.$el.on('click', '.start-scan', _.bind(this._onClickStartScan, this));
            this.$el.on('change', 'td.selection>.selectCheckBox', _.bind(this._onClickFileCheckbox, this));
            this.$el.on('click', '.select-all', _.bind(this._onClickSelectAll, this));
            this.$el.on('click', '.recover-selected', _.bind(this._onClickRecover, this));
        },

        /**
         * Destroy this instance
         */
        destroy: function() {
            OC.Plugins.detach('OCA.RansomwareDetection.FileList', this);
        },

        /**
		 * Event handler for when selecting/deselecting all files
		 */
		_onClickSelectAll: function(e) {
            var self = this;

			var checked = $(e.target).prop('checked');
            console.log("Sequence: " + $(e.target).data('sequence'));
			this.$fileList[$(e.target).data('sequence')].find('td.selection>.selectCheckBox').prop('checked', checked)
				.closest('tr').toggleClass('selected', checked);
			this._selectedFiles = {};
			if (checked) {
                console.log("Target is checked.");
                Object.keys(this.files[$(e.target).data('sequence')]).forEach(function(key) {
                    console.log("Add " + key + " to selected files.");
                    var fileData = self.files[$(e.target).data('sequence')][key];
					self._selectedFiles[fileData.id] = fileData;
                });
			}
			this.updateSelectionSummary($(e.target).data('sequence'));
		},

        /**
		 * Event handler for when clicking on a file's checkbox
		 */
		_onClickFileCheckbox: function(e) {
            console.log('File selected.');
            var $tr = $(e.target).closest('tr');
            var state = !$tr.hasClass('selected');
            var fileData = this.files[$tr.data('sequence')][$tr.data('id')];
            if (state) {
                $tr.addClass('selected');
                this._selectedFiles[fileData.id] = fileData;
            } else {
                $tr.removeClass('selected');
                delete this._selectedFiles[fileData.id];
            }
			this.updateSelectionSummary($tr.data('sequence'));
		},

        /**
         * Create the App header.
         */
        _createScanHeader: function(numberOfSequences) {
            if (this.debug == 1) {
                header = $('<div class="section"><div class="pull-right"><span><a class="action" href="/ocs/v2.php/apps/ransomware_detection/api/v1/export"><span class="icon icon-download"></span>' + t('ransomware_detection', 'Export data') + '</a></span></div></div>');
            } else {
                header = $('<div class="section scan-header"><a href="#" class="button start-scan primary" data-original-title="" title=""><span>Start scan</span></a><div class="pull-right"><span>Sequences scanned: </span><span id="scanned">0</span>/<span id="total-files">' + numberOfSequences + '</span></div>')
            }
            return header;
        },

        /**
         * Event handler to recover files
         */
        _onClickRecover: function(e) {
            var self = this;

            var numberOfFiles = Object.keys(self._selectedFiles).length;
            var sequence = $(e.target).parent().data('sequence');

            OC.dialogs.confirm(t('ransomware_detection', 'Are your sure you want to recover the selected files?'), t('ransomware_detection', 'Confirmation'), function (e) {
                if (e === true) {
                    $.each(self._selectedFiles, function(index, value) {
                        $.ajax({
                            url: self.recoveryUrl,
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({command: parseInt(value.command), path: value.path, timestamp: value.timestamp})
                        }).done(function(response) {
                            console.log("Recovery was a success.");
                            self.$el.find("tr[data-id='" + response['id'] + "']").remove();
                            numberOfFiles = numberOfFiles - 1;
                            delete self._selectedFiles[index];
                            if (numberOfFiles === 0) {
                                self.$section[sequence].remove();
                                delete self.$section[sequence];
                                if (Object.keys(self._selectedFiles).length === 0) {
                                    self.$el.append(self._createAllFilesRecovered);
                                }
                            }
                            self.updateSelectionSummary(sequence);
                        }).fail(function(response, code) {
                            console.log("Recovery failed.");
                        });
                    });
                }
            });
        },

        /**
         * On click listener for start scan.
         */
        _onClickStartScan: function(e) {
            var self = this;

            self.$el.find('#scan-results').parent().parent().remove();
            self.$el.find('#section-suspicious-files-text').remove();
            self.$el.find(".start-scan span").text("Scan running...");
            self.$el.find(".start-scan").addClass("disabled");
            self.$el.append(self._createNoSuspiciousFilesFound());


            if (self.sequencesToScan.length > 0) {
                var count = 0;
                $.getJSON(self.getColorModeUrl, function(schema) {
                    if (schema.color_mode == 1) {
                        console.log('Color blind mode active.');
                        self.colors = {red: 'color-blind-red', orange: 'color-blind-orange', yellow: 'color-blind-yellow', green: 'color-blind-green'};
                        self.colorsText = {red: 'color-blind-red-text', orange: 'color-blind-orange', yellow: 'color-blind-yellow-text', green: 'color-blind-green-text'};
                    }
                    $.each(self.sequencesToScan, function(index, sequence) {
                        $.ajax({
                            url: self.scanSequenceUrl,
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({sequence: sequence})
                        }).done(function(response) {
                            count = count + 1;
                            $('#scanned').text(count);
                            self.$section[index] = self._createSection(index);
                            self.$table[index] = self._createTableSkeleton(index, response.suspicion_score);
                            self.$fileList[index] = self.$table[index].find('tbody.file-list');
                            self.files[index] = [];
                            $.each(response.sequence, function(i, file) {
                                self.files[index][file.id] = file;
                                self.$fileList[index].append(self._createFileRow(file, index));
                                self.$el.find('#section-suspicious-files-text').remove();
                                self.$el.find('#scan-results').show();
                            });
                            self.$section[index].append(self.$table[index]);
                            self.$el.append(self.$section[index]);
                            self.updateSelectionSummary(index);
                        }).fail(function(response, code) {
                            console.log("Scan failed.");
                            count = count + 1;
                            $('#scanned').text(count);
                        }).always(function() {
                            if (count >= self.sequencesToScan.length) {
                                self.$el.find(".start-scan span").text("Scan finished");
                            }
                        });
                    });
                });
            } else {
                console.log("No files to scan.");
            }
        },

        /**
         * Creates the section.
         */
        _createSection: function() {
            var section = $('<div class="section group" id="section-results"></div>');
            return section;
        },

        /**
         * Creates the section.
         */
        _createSection: function(sequence) {
            var section = $('<div class="section group" data-sequence="' + sequence + '"></div>');
            return section;
        },

        /**
         * All files recovered text.
         */
        _createAllFilesRecovered: function() {
            var text = $('<div class="section"><h2>' + t('ransomware_detection', 'All files successfully recovered.') + '</h2></div>');
            return text;
        },

        /**
         * No suspicious files found text.
         */
        _createNoSuspiciousFilesFound: function() {
            var text = $('<div class="section" id="section-suspicious-files-text"><h2>' + t('ransomware_detection', 'No suspicious files found.') + '</h2></div>');
            return text;
        },

        /**
         * Creates a new table skeleton.
         */
        _createTableSkeleton: function(sequence, suspicionScore) {
            var color = this.colors.green;
            if (suspicionScore >= 6) {
                color = this.colors.red;
            } else if (suspicionScore >= 5) {
                color = this.colors.orange;
            } else if (suspicionScore >= 3) {
                color = this.colors.yellow;
            }
            var table =
                $('<div class="row">' +
                    '<div class="sequence-color"><div class="color-box ' + color + '"></div></div>' +
                    '<div class="sequence-table"><table class="ransomware-files" data-sequence="' + sequence + '"><thead>' +
                    '<th><input type="checkbox" data-sequence="' + sequence + '" id="select_all_files_' + sequence + '" class="select-all checkbox"/>' +
                    '<label for="select_all_files_' + sequence + '"><span class="hidden-visually">' + t('ransomware_detection', 'Select all') + '</span></label></th>' +
                    '<th><a class="column-title name">' + t('ransomware_detection', 'Name') + '</a></th>' +
                    '<th><a class="column-title hide-selected"><p>' + t('ransomware_detection', 'Operation') + '</p></a></th>' +
                    '<th><a class="column-title hide-selected"><p>' + t('ransomware_detection', 'Size') + '</p></a></th>' +
                    '<th><a class="column-title hide-selected"><p>' + t('ransomware_detection', 'File class') + '</p></a></th>' +
                    '<th><a class="column-title hide-selected"><p>' + t('ransomware_detection', 'File name class') + '</p></a></th>' +
                    '<th class="controls"><a class="column-title detected">' + t('ransomware_detection', 'Time') + '</a><span class="column-title selected-actions"><a class="recover-selected" data-sequence="' + sequence + '"><span class="icon icon-history"></span><span>' + t('ransomware_detection', 'Recover') + '</span></a></span></th> ' +
                    '</thead><tbody class="file-list"></tbody><tfoot></tfoot></table></div>' +
                '</div>');
            return table;
        },

        /**
         * Creates a new row in the table.
         */
        _createFileRow: function(fileData, sequence) {
            var self = this;
            var td, tr = $('<tr data-id="' + fileData.id + '" data-sequence="' + sequence + '"></tr>'),
                mtime = parseInt(fileData.timestamp, 10) * 1000,
                basename, extension, simpleSize, sizeColor;

            if (isNaN(mtime)) {
    			mtime = new Date().getTime();
    		}

            // size
            if (typeof(fileData.size) !== 'undefined' && fileData.size >= 0) {
				simpleSize = humanFileSize(parseInt(fileData.size, 10), true);
				sizeColor = Math.round(160-Math.pow((fileData.size/(1024*1024)),2));
			} else {
				simpleSize = t('ransomware_detection', 'Pending');
			}

            td = $('<td></td>').attr({ "class": "selection"});
            td.append('<input id="select-' +  this.id + '-' + fileData.id +
					'" type="checkbox" class="selectCheckBox checkbox"/>' +
                    '<label for="select-' +  this.id + '-' + fileData.id + '">' +
                    '<div class="thumbnail" style="background-image:url(' + OC.MimeType.getIconUrl(fileData.type) + '); background-size: 32px;"></div>' +
                    '<span class="hidden-visually">' + t('ransomware_detection', 'Select') + '</span>' +
                    '</label>');
            tr.append(td);

            // file name
            filename = fileData.originalName;
            if (fileData.command === 2) {
                filename = fileData.newName
            }

            if (filename !== null) {
                if (filename.indexOf('.') === 0) {
    				basename = '';
    				extension = name;
                } else {
                    basename = filename.substr(0, filename.lastIndexOf('.'));
    				extension = filename.substr(filename.lastIndexOf('.'));
                }

                var nameSpan = $('<span></span>').addClass('name-text');
    			var innernameSpan = $('<span></span>').addClass('inner-name-text').text(basename);

                nameSpan.append(innernameSpan);

                if (extension) {
    				nameSpan.append($('<span></span>').addClass('extension').text(extension));
    			}
            } else {
               nameSpan = $('<span></span>').addClass('name-text');
               innernameSpan = $('<span></span>').addClass('inner-name-text').text(t('ransomware_detection', 'Not found.'));

               nameSpan.append(innernameSpan);
           }

            td = $('<td></td>').attr({ "class": "file-name"});
            td.append(nameSpan);
            tr.append(td);

            if (fileData.command === 1) {
                // delete
                td = $('<td></td>').append($('<p></p>').attr({"title": "DELETE"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-trash-alt fa-fw"></span>'));
            } else if (fileData.command === 2) {
                // rename
                    td = $('<td></td>').append($('<p></p>').attr({"title": "RENAME"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-font fa-fw"></span>'));
            } else if (fileData.command === 3) {
                // write
                td = $('<td></td>').append($('<p></p>').attr({"title": "WRITE"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-pencil-alt fa-fw"></span>'));
            } else if (fileData.command === 4) {
                // read
                td = $('<td></td>').append($('<p></p>').attr({"title": "READ"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-book fa-fw"></span>'));
            } else if (fileData.command === 5) {
                // create
                td = $('<td></td>').append($('<p></p>').attr({"title": "CREATE"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-pencil-alt fa-fw"></span>'));
            } else {
                // error
                td = $('<td></td>').append($('<p></p>').attr({"title": "ERROR"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-times fa-fw"></span>'));
            }
            tr.append(td);

            // size
            if (typeof(fileData.size) !== 'undefined' && fileData.size >= 0) {
                simpleSize = humanFileSize(parseInt(fileData.size, 10), true);
                sizeColor = Math.round(120-Math.pow((fileData.size/(1024*1024)),2));
            } else {
                simpleSize = t('ransomware_detection', 'Pending');
            }

            td = $('<td></td>').append($('<p></p>').attr({
				"class": "filesize"
			}).text(simpleSize));
            tr.append(td);

            if (fileData.fileClass === 1) {
                // encrypted
                td = $('<td></td>').append($('<p></p>').attr({"title": "ENCRYPTED"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-lock fa-fw"></span>'));
            } else if (fileData.fileClass === 2) {
                // compressed
                    td = $('<td></td>').append($('<p></p>').attr({"title": "COMPRESSED"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-file-archive fa-fw"></span>'));
            } else if (fileData.fileClass === 3) {
                // normal
                td = $('<td></td>').append($('<p></p>').attr({"title": "NORMAL"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-file fa-fw"></span>'));
            } else {
                // error
                td = $('<td></td>').append($('<p></p>').attr({"title": "ERROR"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-times fa-fw"></span>'));
            }
            tr.append(td);

            if (fileData.fileNameClass === 0) {
                // normal
                td = $('<td></td>').append($('<p></p>').attr({"title": "NORMAL"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-check-circle fa-fw"></span>'));
            } else if (fileData.fileNameClass === 1) {
                // suspicious
                td = $('<td></td>').append($('<p></p>').attr({"title": "SUSPICIOUS FILE EXTENSION"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-exclamation-triangle fa-fw"></span>'));
            } else if (fileData.fileNameClass === 2) {
                // suspicious
                td = $('<td></td>').append($('<p></p>').attr({"title": "SUSPICIOUS FILE NAME"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-exclamation-triangle fa-fw"></span>'));
            } else if (fileData.fileNameClass === 3) {
                // suspicious
                td = $('<td></td>').append($('<p></p>').attr({"title": "SUSPICIOUS"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-exclamation-triangle fa-fw"></span>'));
            } else {
                // error
                td = $('<td></td>').append($('<p></p>').attr({"title": "ERROR"}).tooltip({placement: 'top'}).prepend('<span class="fas fa-times fa-fw"></span>'));
            }
            tr.append(td);

            // date column (1000 milliseconds to seconds, 60 seconds, 60 minutes, 24 hours)
			// difference in days multiplied by 5 - brightest shade for files older than 32 days (160/5)
			var modifiedColor = Math.round(((new Date()).getTime() - mtime )/1000/60/60/24*5 );
			// ensure that the brightest color is still readable
			if (modifiedColor >= '160') {
				modifiedColor = 160;
			}
            var formatted;
			var text;
			if (mtime > 0) {
				formatted = OC.Util.formatDate(mtime);
				text = OC.Util.relativeModifiedDate(mtime);
			} else {
				formatted = t('ransomware_detection', 'Unable to determine date');
				text = '?';
			}

            td = $('<td></td>').attr({ "class": "date" });
            td.append($('<span></span>').attr({
				"class": "modified live-relative-timestamp",
				"title": formatted,
				"data-timestamp": mtime,
				"style": 'color:rgb('+modifiedColor+','+modifiedColor+','+modifiedColor+')'
			}).text(text)
			  .tooltip({placement: 'top'})
			);
            tr.append(td);

            // Color row according to suspicion level
            if (fileData.suspicionClass === 1) {
                tr.attr({ 'class': self.colors.red});
            } else if (fileData.suspicionClass === 2) {
                tr.attr({ 'class': self.colors.orange});
            } else if (fileData.suspicionClass === 3) {
                tr.attr({ 'class': self.colors.yellow});
            } else if (fileData.suspicionClass === 4) {
                tr.attr({ 'class': self.colors.green});
            }

            return tr;
        },

        /**
         * Update UI based on the current selection
         */
        updateSelectionSummary: function(sequence) {
        	if (Object.keys(this._selectedFiles).length === 0) {
                console.log("No files selected.");
        		this.$el.find('.selected-actions').css('display', 'none');
                this.$el.find('.detected').css('display', 'block');
                this.$el.find('.name').text(t('ransomware_detection', 'Name')).removeClass('bold');
                this.$el.find('.hide-selected').css('color', '#999');
        	}
        	else {
                console.log(Object.keys(this._selectedFiles).length + " files selected.");
        		this.$table[sequence].find('.selected-actions').css('display', 'block');
                this.$table[sequence].find('.detected').css('display', 'none');
                if (Object.keys(this._selectedFiles).length > 1) {
                    this.$table[sequence].find('.name').text(t('ransomware_detection', '{files} files', {files: Object.keys(this._selectedFiles).length})).addClass('bold');
                } else {
                    this.$table[sequence].find('.name').text(t('ransomware_detection', '{files} file', {files: Object.keys(this._selectedFiles).length})).addClass('bold');
                }
                this.$table[sequence].find('.hide-selected').css('color', '#fff');
            }
        }
    };

    OCA.RansomwareDetection.Scan = Scan;
})();

$(document).ready(function() {});