$(document).ready(() => {
	// paginate if value is set
	if ($('#to_paginate').val() === 'true') {
		if (localStorage.getItem('message_text')) {
			show_notification(localStorage.getItem('message_text'), 'success');
			localStorage.setItem('message_text', '');
		}
		paginate();
	}

	// checks localstorage for sidemenu being opened/closed state
	$('.mainMenu').each(function (index) {
		let menu = $(this).text().trim().toString();
		if (window.localStorage.getItem(menu) === 'closed') {
			$(this).addClass('collapsed');
			$(this).nextUntil('.mainMenu').slideUp('fast');
		}
	});

	// inital stage of docs per page
	if (localStorage.getItem('docsPerPage')) {
		$('#docsPerPage').val(localStorage.getItem('docsPerPage'));
	}

	// toggle the sidebar, resize the main view
	$(document).on('click', '#sidebarToggle', () => {
		$('.row-offcanvas').toggleClass('active');
		$('#sidebar').toggleClass('hidden-xs');
		$('#sidebar').toggleClass('hidden-sm');
		$('#sidebar').toggleClass('hidden-md');
		$('#sidebar').toggleClass('hidden-lg');
		if ($('.row-offcanvas').hasClass('active')) {
			$('#main').removeClass('col-sm-9 col-lg-10');
			$('#main').addClass('col-sm-12 col-lg-12');
		} else {
			$('#main').removeClass('col-sm-12 col-lg-12');
			$('#main').addClass('col-sm-9 col-lg-10');
		}
	});

	// allow collapsable side menu's
	$(document).on('click', '.mainMenuToggle', function () {
		if ($(this).parent().hasClass('collapsed')) {
			window.localStorage.setItem($(this).prev().text().trim(), 'opened');
			$(this).parent().removeClass('collapsed');
			$(this).parent().nextUntil('.mainMenu').slideDown('fast');
		} else {
			window.localStorage.setItem($(this).prev().text().trim(), 'closed');
			$(this).parent().addClass('collapsed');
			$(this).parent().nextUntil('.mainMenu').slideUp('fast');
		}
	});

	// To reset we call paginate() with no query object
	$(document).on('click', '#searchReset', () => {
		if (!$('#searchReset').hasClass('disabled')) {
			localStorage.removeItem('searchQuery');
			window.location.href = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/view/1`;
		}
	});

	$(document).on('click', '#queryDocumentsAction', () => {
		let editor = ace.edit('json');
		let editor_val = editor.getValue();

		if (editor_val !== '') {
			// set the query in localStorage
			localStorage.setItem('searchQuery', editor_val);

			// go to page 1 to remove any issues being on page X from another query/view
			window.location.href = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/view/1`;

			// close the queryDocuments
			$('#queryDocuments').modal('hide');
		} else {
			show_notification('Please enter a query', 'danger');
		}
	});

	// redirect to export
	$(document).on('click', '#exportModalAction', () => {
		let exportId = $('#exportExcludeID').is(':checked') ? 'true' : 'false';
		window.location.href = `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#export_coll').val()}/export/${exportId}`;
	});

	// sets the collection name to be used later to export entire collection
	$(document).on('click', '.exportLink', function () {
		$('#exportExcludeID').prop('checked', false);
		$('#export_coll').val($(this).attr('id'));
	});

	// when docs per page is changed
	$(document).on('change', '#docsPerPage', () => {
		localStorage.setItem('docsPerPage', $('#docsPerPage').val());
		window.location = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/view/1`;
	});

	// set the URL search parameters
	$(document).on('click', '#searchModalAction', () => {
		let key_name = $('#search_key_fields option:selected').text();
		let val = $('#search_value_value').val();

		if (key_name !== '' && val !== '') {
			// build the simply key/value query object and call paginate();
			let qry_obj = {};

			// check if value is a number/integer
			let intReg = new RegExp('^[0-9]+$');
			if (val.match(intReg)) {
				val = parseInt(val);
			} else {
				// if we find an integer wrapped in quotes
				let strIntReg = new RegExp('^"[0-9]"+$');
				if (val.match(strIntReg)) {
					val = val.replace(/"/g, '');
				}
			}

			qry_obj[key_name] = val;

			// set the object to local storage to be used if page changes
			localStorage.setItem('searchQuery', JSON.stringify(qry_obj));

			// check if the key_name is "_id"
			if (key_name == '_id') {
				let query_string = toEJSON.serializeString(`{"_id":ObjectId("${val}")}`);
				localStorage.setItem('searchQuery', query_string);
			}

			// go to page 1 to remove any issues being on page X from another query/view
			window.location.href = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/view/1`;

			// close the searchModal
			$('#searchModal').modal('hide');
		} else {
			show_notification('Please enter a key (field) and a value to search for', 'danger');
		}
	});

	$(document).on('click', '#coll_name_edit', () => {
		let newCollName = $('#coll_name_newval').val();
		if (newCollName !== '') {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/coll_name_edit`,
				data: { 'new_collection_name': newCollName }
			})
				.done(data => {
					$('#headCollectionName').text(newCollName);
					$('#collectioName').modal('toggle');
					localStorage.setItem('message_text', data.msg);
					window.location.href = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${newCollName}/view?page=1`;
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		} else {
			show_notification('Please enter an index', 'danger');
		}
	});

	$(document).on('click', '#coll_create', () => {
		if ($('#new_coll_name').val() !== '') {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/coll_create`,
				data: { 'collection_name': $('#new_coll_name').val() }
			})
				.done(data => {
					$('#del_coll_name').append(`<option>${$('#new_coll_name').val()}</option>`);
					$('#new_coll_name').val('');
					show_notification(data.msg, 'success');
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		} else {
			show_notification('Please enter a collection name', 'danger');
		}
	});

	$(document).on('click', '#coll_delete', () => {
		if (confirm('WARNING: Are you sure you want to delete this collection and all documents?') === true) {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/coll_delete`,
				data: { 'collection_name': $('#del_coll_name option:selected').text() }
			})
				.done(data => {
					$(`#del_coll_name option:contains('${data.coll_name}')`).remove();
					$('#del_coll_name').val($('#del_coll_name option:first').val());
					show_notification(data.msg, 'success');
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		}
	});

	$(document).on('click', '#db_create', () => {
		if ($('#new_db_name').val() !== '') {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/database/${$('#conn_name').val()}/db_create`,
				data: { 'db_name': $('#new_db_name').val() }
			})
				.done(data => {
					$('#del_db_name').append(`<option>${$('#new_db_name').val()}</option>`);
					$('#new_db_name').val('');
					show_notification(data.msg, 'success');
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		} else {
			show_notification('Please enter a database name', 'danger');
		}
	});

	$(document).on('click', '#db_delete', () => {
		if (confirm('WARNING: Are you sure you want to delete this database and all collections?') === true) {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/database/${$('#conn_name').val()}/db_delete`,
				data: { 'db_name': $('#del_db_name option:selected').text() }
			})
				.done(data => {
					$(`#del_db_name option:contains('${data.db_name}')`).remove();
					$('#del_db_name').val($('#del_db_name option:first').val());
					show_notification(data.msg, 'success', true);
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		}
	});

	$(document).on('click', '#user_create', () => {
		if ($('#new_username').val() === '') {
			show_notification('Please enter a Username', 'danger');
			return;
		}
		if ($('#new_password').val() === '' || $('#new_password_confirm').val() === '') {
			show_notification('Please enter a password and confirm', 'danger');
			return;
		}
		if ($('#new_password').val() !== $('#new_password_confirm').val()) {
			show_notification('Passwords do not match', 'danger');
			return;
		}

		$.ajax({
			method: 'POST',
			url: `${$('#app_context').val()}/users/${$('#conn_name').val()}/${$('#db_name').val()}/user_create`,
			data: {
				'username': $('#new_username').val(),
				'user_password': $('#new_password').val(),
				'roles_text': $('#new_user_roles').val()
			}
		})
			.done(data => {
				$('#del_user_name').append(`<option>${$('#new_username').val()}</option>`);
				show_notification(data.msg, 'success');

				// clear items
				$('#new_username').val('');
				$('#new_password').val('');
				$('#new_password_confirm').val('');
				$('#new_user_roles').val('');
			})
			.fail(data => {
				show_notification(data.responseJSON.msg, 'danger');
			});
	});

	$(document).on('click', '#btnqueryDocuments', () => {
		let editor = ace.edit('json');
		if (localStorage.getItem('searchQuery')) {
			editor.setValue(localStorage.getItem('searchQuery'));
		} else {
			editor.setValue('{}');
		}
	});

	$(document).on('click', '#user_delete', () => {
		if (confirm('WARNING: Are you sure you want to delete this user?') === true) {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/users/${$('#conn_name').val()}/${$('#db_name').val()}/user_delete`,
				data: { 'username': $('#del_user_name option:selected').text() }
			})
				.done(data => {
					$(`#del_user_name option:contains('${$('#del_user_name option:selected').text()}')`).remove();
					$('#del_user_name').val($('#del_user_name option:first').val());
					show_notification(data.msg, 'success');
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		}
	});

	$(document).on('click', '#add_config', () => {
		if ($('#new_conf_conn_name').val() !== '' && $('#new_conf_conn_string').val() !== '') {
			let editor = ace.edit('json');
			let editor_val = editor.getValue();

			if (editor_val === '') {
				editor_val = {};
			}

			let data_obj = {};
			data_obj[0] = $('#new_conf_conn_name').val();
			data_obj[1] = $('#new_conf_conn_string').val();
			data_obj[2] = editor_val;

			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/config/add_config`,
				data: data_obj
			})
				.done(data => {
					show_notification(data.msg, 'success');
					setInterval(() => {
						location.reload();
					}, 2500);
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		} else {
			show_notification('Please enter both a connection name and connection string', 'danger');
		}
	});

	$(document).on('click', '.btnConnDelete', function () {
		if (confirm('WARNING: Are you sure you want to delete this connection?') === true) {
			let current_name = $(this).parents('.conn_id').attr('id');
			let rowElement = $(this).parents('.connectionRow');

			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/config/drop_config`,
				data: { 'curr_config': current_name }
			})
				.done(data => {
					rowElement.remove();
					show_notification(data.msg, 'success');
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		}
	});

	$(document).on('click', '.btnConnUpdate', function () {
		if ($('#conf_conn_name').val() !== '' || $('#conf_conn_string').val() !== '') {
			let current_name = $(this).parents('.conn_id').attr('id');
			let new_name = $(this).parents('.connectionRow').find('.conf_conn_name').val();
			let new_string = $(this).parents('.connectionRow').find('.conf_conn_string').val();

			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/config/update_config`,
				data: { 'curr_config': current_name, 'conn_name': new_name, 'conn_string': new_string }
			})
				.done(function (data) {
					$(this).parents('.connectionRow').find('.conf_conn_name').val(data.name);
					$(this).parents('.connectionRow').find('.conf_conn_string').val(data.string);
					show_notification(data.msg, 'success', true);
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		} else {
			show_notification('Please enter a connection name and connection string', 'danger');
		}
	});

	// redirect to connection
	$(document).on('click', '.btnConnConnect', function () {
		window.location.href = `${$('#app_context').val()}/app/${$(this).parents('.conn_id').attr('id')}`;
	});
	// JSON 或者 表格方式显示数据
	let viewTypes = ['list', 'table'];
	if ($('#viewType')) {
		if (localStorage.getItem('view')) {
			$(`#viewType .coll-${localStorage.getItem('view')}`).addClass('label-success');
		} else {
			$('#viewType .coll-list').addClass('label-success');
			localStorage.setItem('view', 'list');
		}
	}
	viewTypes.forEach(type => {
		$(`#viewType .coll-${type}`).click(function () {
			if ($(this).hasClass('label-success')) {
				return;
			}
			$(this).addClass('label-success');
			$(`#viewType .coll-${'listtable'.replace(type, '')}`).removeClass('label-success');

			$(`.${type}-cells`).removeClass('d-none');
			$(`.${'listtable'.replace(type, '')}-cells`).addClass('d-none');

			localStorage.setItem('view', type);
		});
	});
});

function paginate () {
	$('#doc_load_placeholder').show();

	let page_num = $('#page_num').val();
	let page_len = $('#docs_per_page').val();
	let coll_name = $('#coll_name').val();
	let conn_name = $('#conn_name').val();
	let db_name = $('#db_name').val();
	let doc_id = $('#doc_id').val();

	// check local storage for pagination
	if (localStorage.getItem('docsPerPage')) {
		page_len = localStorage.getItem('docsPerPage');
	} else {
		localStorage.setItem('docsPerPage', page_len);
	}

	// get the query (if any)
	let query_string;
	if (doc_id) {
		query_string = toEJSON.serializeString(`{"_id":ObjectId("${doc_id}")}`);
	} else {
		query_string = localStorage.getItem('searchQuery');
		query_string = toEJSON.serializeString(query_string);
	}

	// add search to the API URL if it exists
	let api_url = `${$('#app_context').val()}/api/${conn_name}/${db_name}/${coll_name}/${page_num}`;
	let pager_href = `${$('#app_context').val()}/app/${conn_name}/${db_name}/${coll_name}/view/{{number}}`;

	$.ajax({
		type: 'POST',
		dataType: 'json',
		url: api_url,
		data: { 'query': query_string, 'docsPerPage': page_len }
	})
		.done(response => {
			// show message when none are found
			if (response.data === '' || response.total_docs === 0) {
				$('#doc_none_found').removeClass('hidden');
			} else {
				$('#doc_none_found').addClass('hidden');
			}

			let total_docs = Math.ceil(response.total_docs / page_len);

			// remove the doc class when single doc is retured
			let docClass = 'doc_view';
			if (response.total_docs === 1) {
				docClass = '';
			}

			if (total_docs > 1) {
				$('#pager').show();
				$('#pager').bootpag({
					total: total_docs,
					page: page_num,
					maxVisible: 5,
					href: pager_href,
					firstLastUse: true
				});
			} else {
				$('#pager').hide();
			}

			let isFiltered = '';

			// enable/disable the reset filter button
			if (query_string == null) {
				$('#searchReset').addClass('disabled');
			} else {
				$('#searchReset').removeClass('disabled');
				isFiltered = ' <span class=\'text-danger\'>(filtered)</span>';
			}

			// set the total record count
			$('#recordCount').html(response.total_docs + isFiltered);

			// if filtered, change button text
			if (query_string !== null) {
				$('#btnMassDelete').html('Delete selected');
			}

			// disable/enable the mass delete button if records are returned
			if (total_docs === 0) {
				$('#btnMassDelete').prop('disabled', true);
			} else {
				$('#btnMassDelete').prop('disabled', false);
			}

			// clear the div first
			$('#coll_docs').empty();

			let viewType = localStorage.getItem('view');
			let table = `
				<div class="col-xs-12 col-md-12 col-lg-12 no-wrap ${viewType == 'list' ? 'd-none' : ''} table-cells">
					<div class="d-inline-block">
						<table class="table table-bordered bg-grey">
							<thead>
								<tr id="docKeys"></tr>
							</thead>
							<tbody id="docLines"></tbody>
						</table>
					</div>
					<div class="d-inline-block">
						<table class="table table-bordered">
							<thead id="operatTh"></thead>
							<tbody id="operatorLines"></tbody>
						</table>
					</div>
				</div>
				`;
			$('#coll_docs').append(table);

			let escaper = $('<div></div>');
			let keys = [];
			for (let i = 0; i < response.data.length; i++) {
				escaper[0].textContent = JSON.stringify(response.data[i], null, 4);
				let inner_html = `<div class="col-xs-12 col-md-10 col-lg-10 no-side-pad ${viewType == 'table' ? 'd-none' : ''} list-cells"><pre class="code-block ${docClass}"><i class="fa fa-chevron-down code-block_expand"></i><code class="json">${escaper[0].innerHTML}</code></pre></div>`;
				inner_html += `<div class="col-md-2 col-lg-2 pad-bottom no-pad-right justifiedButtons ${viewType == 'table' ? 'd-none' : ''} list-cells">`;
				inner_html += '<div class="btn-group btn-group-justified justifiedButtons" role="group" aria-label="...">';
				inner_html += `<a href="#" class="btn btn-danger btn-sm" onclick="deleteDoc('${response.data[i]._id}')">${response.deleteButton}</a>`;
				inner_html += `<a href="${$('#app_context').val()}/app/${conn_name}/${db_name}/${coll_name}/${response.data[i]._id}" class="btn btn-info btn-sm">${response.linkButton}</a>`;
				inner_html += `<a href="${$('#app_context').val()}/app/${conn_name}/${db_name}/${coll_name}/edit/${response.data[i]._id}" class="btn btn-success btn-sm">${response.editButton}</a>`;
				inner_html += '</div></div>';
				$('#coll_docs').append(inner_html);

				if (!keys.length) {
					keys = Object.keys(response.data[i]);
				}
				let cells = cellGenerator(keys.length);
				for (let key in response.data[i]) {
					let index = keys.indexOf(key);
					if (index < 0) {
						keys.push(key);
						cellsUpdate(cells);
						index = keys.length - 1;
					}
					let prop = response.data[i][key];
					let type = Object.prototype.toString.call(prop);
					if (type === '[object Object]') {
						cellsUpdate(cells, index, '{Object}');
						continue;
					}
					if (type === '[object Array]') {
						cellsUpdate(cells, index, '[Array]');
						continue;
					}
					if ((/^\d{4}-\d{2}-\d{2}T(.*)?Z$/).test(prop)) {
						cellsUpdate(cells, index, formatTime(prop));
					}
					cellsUpdate(cells, index, prop);
				}
				$('#docLines').append(`<tr>${cells.join('')}</tr>`);

				let operatorCells = cellGenerator(3);
				cellsUpdate(operatorCells, 0, `<a href="#" onclick="deleteDoc('${response.data[i]._id}')">${response.deleteButton}</a>`);
				cellsUpdate(operatorCells, 1, `<a href="${$('#app_context').val()}/app/${conn_name}/${db_name}/${coll_name}/${response.data[i]._id}">${response.linkButton}</a>`);
				cellsUpdate(operatorCells, 2, `<a href="${$('#app_context').val()}/app/${conn_name}/${db_name}/${coll_name}/edit/${response.data[i]._id}">${response.editButton}</a>`);
				$('#operatorLines').append(`<tr>${operatorCells.join('')}</tr>`);

			}
			if (keys.length) {
				$('#operatTh').append(`
				<tr class="text-white">
					<th class="bg-danger">删除</th>
					<th class="bg-info">查看</th>
					<th class="bg-success">编辑</th>
				</tr>
			`);
				$('#docKeys').append(thGenerator(keys));
			}

			// Bind the DropDown Select For Fields
			let option = '';
			for (let x = 0; x < response.fields.length; x++) {
				option += `<option value="${response.fields[x]}">${response.fields[x]}</option>`;
			}
			$('#search_key_fields').append(option);

			// hide the loading placeholder
			$('#doc_load_placeholder').hide();

			// hook up the syntax highlight and prettify the json
			hljs.configure({ languages: ['json'] });
			$('.code-block').each((i, block) => {
				hljs.highlightBlock(block);
				$(block).find('.code-block_expand').click(event => {
					$(block).toggleClass('expanded');
				});
			});

			// Show extended message if API returns an invalid query
			if (response.validQuery === false) {
				show_notification(`Invalid query syntax${response.queryMessage}`, 'danger', false, 3000);
			}
		})
		.fail(() => {
			show_notification('Error getting data from Query API', 'danger');
		});
}

function deleteDoc (doc_id) {
	if (confirm('WARNING: Are you sure you want to delete this document?') === true) {
		$.ajax({
			method: 'POST',
			url: `${$('#app_context').val()}/document/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/doc_delete`,
			data: { doc_id }
		})
			.done(data => {
				show_notification(data.msg, 'success');
				paginate();
			})
			.fail(data => {
				show_notification(data.responseJSON.msg, 'danger');
			});
	}
}

$(document).on('click', '#btnMassDelete', () => {
	let doc_id = $('#doc_id').val();
	let coll_name = $('#coll_name').val();
	let conn_name = $('#conn_name').val();
	let db_name = $('#db_name').val();
	let query_string;

	// get the query (if any)
	if (doc_id) {
		query_string = toEJSON.serializeString(`{"_id":ObjectId("${doc_id}")}`);
	} else {
		let local_query_string = localStorage.getItem('searchQuery');
		query_string = toEJSON.serializeString(local_query_string);
	}

	// set the default confirm text
	let confirmText = 'WARNING: Are you sure you want to delete all documents in this collection?';

	// if a query is specified, show the "selection" alternative text
	if (query_string) {
		confirmText = 'WARNING: Are you sure you want to delete the selection of documents?';
	}

	if (confirm(confirmText) === true) {
		$.ajax({
			method: 'POST',
			url: `${$('#app_context').val()}/document/${conn_name}/${db_name}/${coll_name}/mass_delete`,
			data: { 'query': query_string }
		})
			.done(data => {
				localStorage.removeItem('searchQuery');
				show_notification(data.msg, 'success', true);
			})
			.fail(data => {
				show_notification(data.responseJSON.msg, 'danger');
			});
	}
});

// restore DB
$(document).on('click', '#db_restore', () => {
	if ($('#restore_db_name').val() !== null) {
		if (confirm(`WARNING: Are you absolutely sure you want to restore the "${$('#restore_db_name').val()}" database?`) === true) {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/database/${$('#conn_name').val()}/${$('#restore_db_name').val()}/db_restore/`,
				data: { 'dropTarget': $('#restore_db_action').val() }
			})
				.done(data => {
					show_notification(data.msg, 'success', true);
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		}
	}
});

// backup DB
$(document).on('click', '#db_backup', () => {
	$.ajax({
		method: 'POST',
		url: `${$('#app_context').val()}/database/${$('#conn_name').val()}/${$('#backup_db_name').val()}/db_backup/`,
		data: {}
	})
		.done(data => {
			show_notification(data.msg, 'success', true);
		})
		.fail(data => {
			show_notification(data.responseJSON.msg, 'danger');
		});
});

$(document).on('click', '#coll_addindex', () => {
	let edit = ace.edit('json');
	let json = $.parseJSON(edit.getValue());

	if (json !== '{}') {
		let data_obj = {};
		data_obj[0] = JSON.stringify(json);
		data_obj[1] = $('#index_unique').is(':checked') ? 'true' : 'false';
		data_obj[2] = $('#index_sparse').is(':checked') ? 'true' : 'false';

		$.ajax({
			method: 'POST',
			url: `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/create_index`,
			data: data_obj
		})
			.done(data => {
				show_notification(data.msg, 'success', true);
			})
			.fail(data => {
				show_notification(data.responseJSON.msg, 'danger');
			});
	} else {
		show_notification('Please enter an index', 'danger');
	}
});

function dropIndex (index_index) {
	$.ajax({
		method: 'POST',
		url: `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/drop_index`,
		data: { 'index': index_index }
	})
		.done(data => {
			$(`#index_row_${index_index}`).remove();
			show_notification(data.msg, 'success');
		})
		.fail(data => {
			show_notification(data.responseJSON.msg, 'danger');
		});
}

// show notification popup
function show_notification (msg, type, reload_page, timeout) {
	// defaults to false
	reload_page = reload_page || false;
	timeout = timeout || 3000;

	$('#notify_message').removeClass();
	$('#notify_message').addClass(`notify_message-${type}`);
	$('#notify_message').html(msg);
	$('#notify_message').slideDown(600).delay(timeout).slideUp(600, () => {
		if (reload_page === true) {
			location.reload();
		}
	});
}

function formatTime (date) {
	if (!(date instanceof Date)) {
		date = new Date(date);
	}
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hour = date.getHours();
	const minute = date.getMinutes();
	const second = date.getSeconds();

	return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`;
}

function formatNumber (n) {
	n = n.toString();
	return n[1] ? n : `0${n}`;
}

function cellGenerator (length) {
	let tds = [];
	for (let i = 0; i < length; i++) {
		tds.push('<td>null</td>');
	}
	return tds;
}
function cellsUpdate (cells, index, val) {
	if (index !== undefined) {
		cells[index] = cells[index].replace('null', val);
	} else {
		cells.push('<td>null</td>');
	}
}
function thGenerator (keys) {
	let ths = [];
	for (let i = 0; i < keys.length; i++) {
		if (keys[i].endsWith('At')) {
			ths.push(`<th class="td-min-width">${keys[i]}</th>`);
			continue;
		}
		ths.push(`<th>${keys[i]}</th>`);
	}
	return ths.join('');
}
